const AWS = require('aws-sdk')
const parse = require('csv-parse')
const Joi = require('joi')

const { Dataset } = require('../models')

const s3 = new AWS.S3()

function validateConfig (rows, config) {
  // TODO: validate variable ids from database
  const fields = Object.keys(rows[0])
  const column = Joi.string().valid(...fields).required()
  const schema = Joi.object({
    timestamp: Joi.object({
      column,
      timezone: Joi.string().valid('UTC', 'EDT', 'EST').required()
    }),
    variables: Joi.array().items(
      Joi.object({
        column,
        id: Joi.string().valid('FLOW_CFS', 'STAGE_FT')
      })
    ).required().min(1)
  })

  const { error, value } = schema.validate(config)

  if (error) {
    console.error(error)
    throw new Error(`Invalid config object (${error.toString()})`)
  }

  return value
}

function parseDataset ({ s3: s3File }) {
  const { Bucket, Key } = s3File
  const stream = s3.getObject({ Bucket, Key }).createReadStream()
  const rows = []
  return new Promise((resolve, reject) => {
    const parser = parse({
      delimiter: ',',
      columns: true
    }).on('data', (row) => {
      rows.push(row)
    }).on('end', () => {
      resolve(rows)
    }).on('err', err => reject(err))

    stream.pipe(parser)
  })
}

function generateSeries (data, { timestamp, variables }) {
  const series = variables.map(variable => {
    const values = data.map(d => ({
      timestamp: d[timestamp.column],
      value: d[variable.column]
    }))
    return {
      variable_id: variable.id,
      values
    }
  })
  return series
}

async function processDataset (id) {
  console.log(`processing dataset (id=${id})`)

  console.log(`fetching dataset record (id=${id})`)
  const dataset = await Dataset.query()
    .patch({ status: 'PROCESSING' })
    .findById(id).returning('*')
  if (!dataset) throw new Error(`Dataset record (id=${id}) not found`)

  const deletedSeries = await Dataset.relatedQuery('series').for(id).delete()

  if (deletedSeries > 0) {
    console.log(`deleted existing series (n=${deletedSeries})`)
  }

  console.log(`parsing dataset file (Key=${dataset.s3.Key})`)
  const rows = await parseDataset(dataset)

  if (!rows || rows.length === 0) throw new Error('No data found in dataset')

  console.log('validating config file')
  const config = dataset.config
  validateConfig(rows, config)

  console.log(`generating series (nrows=${rows.length}, nvars=${config.variables.length})`)
  const series = generateSeries(rows, config)

  console.log(`saving series (n=${series.length})`)
  await dataset.$relatedQuery('series').insertGraph(series)

  console.log('updating dataset status')
  await dataset.$query().patch({
    status: 'DONE',
    start_timestamp: rows[0][config.timestamp.column],
    end_timestamp: rows[rows.length - 1][config.timestamp.column],
    n_rows: rows.length
  }).returning('*')

  return await Dataset.query().findById(id).withGraphFetched('series')
}

module.exports = async function (id) {
  try {
    await processDataset(id)
  } catch (e) {
    console.log('failed')
    console.error(e)
    await Dataset.query()
      .patch({
        status: 'FAILED',
        error_message: e.toString()
      })
      .findById(id)
  }
}
