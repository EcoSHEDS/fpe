const AWS = require('aws-sdk')
const Papa = require('papaparse')
const stripBom = require('strip-bom')
const Joi = require('joi')
const { DateTime } = require('../lib/time')

const { Dataset } = require('../models')

const s3 = new AWS.S3()

function validateConfig (config, fields) {
  const fileColumn = Joi.string().valid(...fields)
  const schema = Joi.object({
    timestamp: Joi.object({
      column: fileColumn.required(),
      timeColumn: fileColumn.allow(null),
      utcOffset: Joi.number().required()
    }),
    variables: Joi.array().items(
      Joi.object({
        id: Joi.string().valid('FLOW_CFS', 'STAGE_FT', 'PRESSURE_KPA', 'SPCOND_USCM25', 'WTEMP_C', 'ATEMP_C', 'OTHER'),
        column: fileColumn.required(),
        flag: Joi.string().empty('').allow(null).valid(...fields),
        scale: Joi.number().default(1),
        offset: Joi.number().default(0)
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

async function parseFile ({ s3: s3File }) {
  const { Bucket, Key } = s3File
  const object = await s3.getObject({ Bucket, Key }).promise()
  const csv = stripBom(object.Body.toString())

  const parsed = Papa.parse(csv, {
    header: true,
    comments: '#',
    delimiter: ',',
    columns: true,
    skipEmptyLines: 'greedy'
  })

  return parsed
}

function createRowParser (timestamp, variable, timezone) {
  const utcOffset = timestamp.utcOffset
  const scale = variable.scale || 1
  const offset = variable.offset || 0

  return (d, i) => {
    let rawTimestamp = d[timestamp.column]

    let timeValue
    if (timestamp.timeColumn) {
      timeValue = d[timestamp.timeColumn]
      if (timeValue.length == 4 || timeValue.length == 7) {
        timeValue = `0${timeValue}`
      }
      rawTimestamp = `${rawTimestamp}T${timeValue}`
    }
    const timestampTimezone = utcOffset === 0 ? 'UTC' : `UTC${utcOffset}`
    const parsedTimestamp = DateTime.fromISO(rawTimestamp.replace(' ', 'T'))
      .setZone(timestampTimezone, { keepLocalTime: true })
    if (!parsedTimestamp.isValid) {
      throw new Error(`Failed to parse timestamp at row ${i.toLocaleString()} ("${rawTimestamp}").`)
    }

    const rawValue = d[variable.column]
    const parsedValue = rawValue.length === 0 ? NaN : ((Number(rawValue) + offset) * scale)
    const parsedFlag = variable.flag && d[variable.flag].length > 0 ? d[variable.flag] : null

    return {
      date: parsedTimestamp.setZone(timezone).toISODate(),
      timestamp: parsedTimestamp.toISO(),
      value: parsedValue,
      flag: parsedFlag
    }
  }
}

function createSeries (data, { timestamp, variables }, { timezone }) {
  const series = variables.map(variable => {
    const parser = createRowParser(timestamp, variable, timezone)
    const values = data.map(parser)
    return {
      variable_id: variable.id,
      values
    }
  })
  return series
}

async function processDataset (id, { dryRun }) {
  if (dryRun) console.log('dryRun: on')
  console.log(`processing dataset (id=${id})`)

  let dataset
  console.log(`fetching dataset record (id=${id})`)
  if (dryRun) {
    dataset = await Dataset.query()
      .findById(id)
  } else {
    dataset = await Dataset.query()
      .patch({ status: 'PROCESSING' })
      .findById(id)
      .returning('*')
  }
  if (!dataset) throw new Error(`Dataset record (id=${id}) not found`)

  console.log(`fetching station record (id=${dataset.station_id})`)
  const station = await dataset.$relatedQuery('station')

  if (!dryRun) {
    const deletedSeries = await Dataset.relatedQuery('series').for(id).delete()

    if (deletedSeries > 0) {
      console.log(`deleted existing series (id=${id}, n=${deletedSeries})`)
    }
  }

  console.log(`parsing dataset file (id=${id}, Key=${dataset.s3.Key})`)
  const parsed = await parseFile(dataset)

  if (parsed.errors.length > 0) {
    console.log(parsed.errors)
    throw new Error(`Failed to parse file (${parsed.errors[0].message || parsed.errors[0].toString()})`)
  }

  if (!parsed.data || parsed.data.length === 0) throw new Error('No data found in dataset file')

  const config = dataset.config
  console.log(`validating dataset config (id=${id})`)
  validateConfig(config, parsed.meta.fields)

  console.log(`creating series (id=${id}, nrows=${parsed.data.length}, nvars=${config.variables.length})`)
  const series = createSeries(parsed.data, config, station)

  if (dryRun) {
    console.log(`finished (id=${id})`)
    series.map((s, i) => {
      console.log(`series ${i} (variable_id=${s.variable_id}, n_values=${s.values.length})`)
      console.log(s.values.slice(0, 9))
    })
    return series
  }

  console.log(`saving series (id=${id}, n=${series.length})`)
  await dataset.$relatedQuery('series').insertGraph(series)

  console.log(`fetching series summary (id=${id})`)
  const seriesSummary = await dataset.$relatedQuery('series').modify('seriesSummary')
  if (seriesSummary.length === 0) {
    throw new Error(`Failed to fetch series summary (id=${id})`)
  }
  const startTimestamp = seriesSummary[0].start_timestamp
  const endTimestamp = seriesSummary[0].end_timestamp

  console.log(`updating dataset status (id=${id})`)
  await dataset.$query().patch({
    status: 'DONE',
    start_timestamp: startTimestamp,
    end_timestamp: endTimestamp,
    n_rows: parsed.data.length
  }).returning('*')

  console.log(`finished (id=${id})`)
  return await Dataset.query().findById(id).withGraphFetched('series')
}

async function processDatasets (ids, options) {
  let datasets = []
  if (options.all) {
    datasets = await Dataset.query().where('status', 'CREATED')
  } else {
    datasets = await Dataset.query().findByIds(ids.map(id => +id))
  }

  if (datasets.length === 0) {
    throw new Error('No datasets found')
  }

  const success = []
  const failed = []
  for (let i = 0; i < datasets.length; i++) {
    const dataset = datasets[i]

    try {
      await processDataset(dataset.id, options)
      success.push(dataset)
    } catch (e) {
      await dataset.$query().patch({
        status: 'FAILED',
        error_message: e.message || e.toString()
      })
      failed.push({
        error: e,
        dataset
      })
    }
  }

  return { success, failed }
}

module.exports = async function (ids, options) {
  try {
    const { success, failed } = await processDatasets(ids, options)
    console.log(`finished: success=${success.length} failed=${failed.length}`)
    success.forEach(d => {
      console.log(`success: ${d.id}`)
    })
    failed.forEach(d => {
      console.log(`failed: ${d.id} (error=${d.error.message || d.error.toString()})`)
    })
  } catch (e) {
    console.log(`failed: ${e.message || e.toString()}`)
    throw e
  }
}
