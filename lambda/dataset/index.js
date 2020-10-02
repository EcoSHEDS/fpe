const AWS = require('aws-sdk')
const parse = require('csv-parse')
const { Dataset } = require('./db/models')

const s3 = new AWS.S3()

function validateConfig (rows, config) {
  // TODO: validate variable ids from database
  const fields = Object.keys(rows[0])
  if (!config) {
    throw new Error('Dataset configuration not found')
  }
  if (!config.columns) {
    throw new Error('Column definitions not defined in dataset configuration')
  }
  if (!config.columns.timestamp) {
    throw new Error('Timestamp column not defined in dataset configuration')
  }
  if (!fields.includes(config.columns.timestamp)) {
    throw new Error(`Timestamp column (${config.columns.timestamp}) not found in dataset file`)
  }
  if (!config.columns.variables || config.columns.variables.lenth === 0) {
    throw new Error('No variable columns defined in dataset configuration')
  }
  config.columns.variables.forEach(v => {
    if (!fields.includes(v.column)) {
      throw new Error(`Variable column (${v.column}) not found in dataset file`)
    }
  })
  return true
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

function generateSeries (data, { columns }) {
  const series = columns.variables.map(c => {
    const observations = data.map(d => ({
      timestamp: d[columns.timestamp],
      value: d[c.column]
    }))
    return {
      variable_id: c.variable_id,
      start_timestamp: observations[0].timestamp,
      end_timestamp: observations[observations.length - 1].timestamp,
      n_values: observations.length,
      observations
    }
  })
  return series
}

exports.handler = async function (event, context, callback) {
  // console.log('env: ', JSON.stringify(process.env, null, 2))
  console.log('event: ', JSON.stringify(event, 2, null))

  console.log(`fetching dataset record (id=${event.id})`)
  let dataset = await Dataset.query().patch({ status: 'PROCESSING' }).findById(event.id).returning('*')
  if (!dataset) throw new Error(`Dataset record (id=${event.id}) not found`)

  const deletedSeries = await Dataset.relatedQuery('series').for(event.id).delete()

  if (deletedSeries > 0) {
    console.log(`deleted existing series (n=${deletedSeries})`)
  }

  console.log(`parsing dataset file (Key=${dataset.s3.Key})`)
  const rows = await parseDataset(dataset)

  if (!rows || rows.length === 0) throw new Error('No data found in dataset')

  console.log('validating config file')
  validateConfig(rows, dataset.config)

  console.log(`generating series (nrows=${rows.length}, nvars=${dataset.config.columns.variables.length})`)
  const series = generateSeries(rows, dataset.config)

  console.log(`saving series (n=${series.length})`)
  await dataset.$relatedQuery('series').insertGraph(series)

  console.log('updating dataset status')
  await dataset.$query().patch({ status: 'DONE' }).returning('*')

  dataset = await Dataset.query().findById(event.id).withGraphFetched('series')
  console.log(JSON.stringify(dataset, null, 2))

  return dataset
}
