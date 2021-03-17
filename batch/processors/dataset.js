const AWS = require('aws-sdk')
const Papa = require('papaparse')
const stripBomStream = require('strip-bom-stream')
const Joi = require('joi')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.tz.setDefault('UTC')

const { Dataset } = require('../models')

const s3 = new AWS.S3()

function validateConfig (rows, config) {
  // TODO: validate variable ids from database
  const fields = Object.keys(rows[0])
  const fileColumn = Joi.string().valid(...fields)
  const schema = Joi.object({
    timestamp: Joi.object({
      column: fileColumn.required(),
      timezone: Joi.object({
        id: Joi.string().required(),
        label: Joi.string().required(),
        utcOffset: Joi.number().required()
      }).required()
    }),
    variables: Joi.array().items(
      Joi.object({
        id: Joi.string().valid('FLOW_CFS', 'STAGE_FT'),
        column: fileColumn.required(),
        flag: Joi.string().empty('').allow(null).valid(...fields),
        scale: Joi.number()
      })
    ).required().min(1)
  })

  const { error, value } = schema.validate(config)

  if (error) {
    // console.error(error)
    throw new Error(`Invalid config object (${error.toString()})`)
  }

  return value
}

function parseDatasetStream ({ s3: s3File }) {
  const { Bucket, Key } = s3File
  const stream = s3.getObject({ Bucket, Key }).createReadStream()
  const rows = []
  return new Promise((resolve, reject) => {
    const parser = Papa.parse(Papa.NODE_STREAM_INPUT, {
      header: true,
      comments: '#',
      delimiter: ',',
      columns: true,
      skipEmptyLines: 'greedy'
    })

    return stream
      .pipe(stripBomStream())
      .pipe(parser)
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('err', err => reject(err))
  })
}

function generateSeries (data, { timestamp, variables }) {
  const utcOffset = timestamp.timezone.utcOffset
  const series = variables.map(variable => {
    const values = data.map((d, i) => {
      const rawTimestamp = d[timestamp.column]
      const parsedTimestamp = dayjs(rawTimestamp).utc(true).subtract(utcOffset, 'hour')
      if (!parsedTimestamp.isValid()) {
        throw new Error(`Failed to parse timestamp at row ${i.toLocaleString()} ("${rawTimestamp}").`)
      }

      const rawValue = d[variable.column]
      const parsedValue = rawValue.length === 0 ? NaN : Number(rawValue).toFixed(3)

      const parsedFlag = variable.flag && d[variable.flag].length > 0 ? d[variable.flag] : null

      return {
        date: parsedTimestamp.add(utcOffset, 'hour').format('YYYY-MM-DD'),
        timestamp: parsedTimestamp.toISOString(),
        value: parsedValue,
        flag: parsedFlag
      }
    })
    return {
      variable_id: variable.id,
      values
    }
  })
  return series
}

async function processDataset (id, dryRun) {
  if (dryRun) console.log('dryRun: on')
  console.log(`processing dataset (id=${id})`)

  console.log(`fetching dataset record (id=${id})`)
  const dataset = await Dataset.query()
    .patch({ status: 'PROCESSING' })
    .findById(id).returning('*')
  if (!dataset) throw new Error(`Dataset record (id=${id}) not found`)

  if (!dryRun) {
    const deletedSeries = await Dataset.relatedQuery('series').for(id).delete()

    if (deletedSeries > 0) {
      console.log(`deleted existing series (id=${id}, n=${deletedSeries})`)
    }
  }

  console.log(`parsing dataset file (id=${id}, Key=${dataset.s3.Key})`)
  const rows = await parseDatasetStream(dataset)

  if (!rows || rows.length === 0) throw new Error('No data found in dataset file')

  console.log(`validating config file (id=${id})`)
  const config = dataset.config
  validateConfig(rows, config)

  console.log(`generating series (id=${id}, nrows=${rows.length}, nvars=${config.variables.length})`)
  const series = generateSeries(rows, config)

  if (dryRun) {
    console.log('finished')
    series.map((s, i) => {
      console.log(`series ${i} (variable_id='${s.variable_id}', n_values=${s.values.length})`)
      console.log(s.values.slice(0, 9))
    })
    return series
  }

  console.log(`saving series (id=${id}, n=${series.length})`)
  await dataset.$relatedQuery('series').insertGraph(series)

  console.log(`updating dataset status (id=${id})`)
  await dataset.$query().patch({
    status: 'DONE',
    start_timestamp: rows[0][config.timestamp.column],
    end_timestamp: rows[rows.length - 1][config.timestamp.column],
    n_rows: rows.length
  }).returning('*')

  console.log(`finished (id=${id})`)
  return await Dataset.query().findById(id).withGraphFetched('series')
}

module.exports = async function (id, options) {
  try {
    await processDataset(id, options.dryRun)
  } catch (e) {
    console.log(`failed (id=${id})`)
    console.error(e)
    await Dataset.query()
      .patch({
        status: 'FAILED',
        error_message: e.message || e.toString()
      })
      .findById(id)
  }
}
