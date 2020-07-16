const Papa = require('papaparse')
const fs = require('fs')
const path = require('path')

const { Station, Dataset } = require('../db/models')
const { DatasetConfigurationError, NotFoundError } = require('./lib/errors')
const { fw } = require('./lib/utils')

function parseDatasetFile (filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createReadStream(filename)
    Papa.parse(file, {
      header: true,
      complete: function (results, file) {
        resolve(results)
      },
      error: (err) => reject(err)
    })
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

function validateConfig (parsed, config) {
  const fields = parsed.meta.fields
  if (!fields.includes(config.columns.timestamp)) {
    throw new DatasetConfigurationError(`Timestamp column (${config.columns.timestamp}) not found in dataset file`)
  }
  config.columns.variables.forEach(v => {
    if (!fields.includes(v.column)) {
      throw new DatasetConfigurationError(`Variable column (${v.column}) not found in dataset file`)
    }
  })
  return true
}

exports.listDatasets = async function (options) {
  console.log(`
List datasets
  station id: ${options.station || '<ANY>'}
  `)

  let query = Dataset.query().orderBy(['id'])
  if (options.station) {
    query = query.where({ station_id: options.station })
  }
  const rows = await query

  if (rows.length === 0) {
    console.log('No datasets found')
  } else {
    console.log('  id | station_id |                 filename')
    console.log('-----|------------|-------------------------')
    rows.forEach(row => console.log(`${fw(row.id, 4)} | ${fw(row.station_id, 10)} | ${fw(row.filename, 24)}`))
  }
}

exports.createDataset = async function (filename, options) {
  console.log(`
Create new dataset
        filename: ${filename}
      station id: ${options.station}
timestamp column: ${options.timestamp}
variable column(s): ${options.variable}
  `)

  // create config
  const config = {
    columns: {
      timestamp: options.timestamp,
      variables: options.variable.map(v => {
        const [column, variable] = v.split('=')
        return { column, variable }
      })
    }
  }

  // get station
  const station = await Station.query().findById(options.station)
  if (!station) {
    throw new NotFoundError(`Station (id=${options.station}) does not exist`)
  }

  // parse
  const parsed = await parseDatasetFile(filename)
  console.log(`dataset parsed (n rows=${parsed.data.length.toLocaleString()})`)

  // validate config
  validateConfig(parsed, config)
  console.log('configuration validated')

  // transform
  const series = await generateSeries(parsed.data, config)
  console.log(`series generated (n series=${series.length.toLocaleString()})`)

  // create dataset object
  const props = {
    filename: path.basename(filename),
    config,
    status: 'DONE',
    series
  }

  // save to database
  const dataset = await station.$relatedQuery('datasets').insertGraph(props).returning('*')
  console.log(`dataset saved to db (id=${dataset.id})`)
}

exports.deleteDataset = async function (id) {
  console.log(`
Deleting dataset
  id: ${id}
  `)

  const nrow = await Dataset.query().deleteById(id)
  if (nrow === 0) {
    console.error(`Error: Failed to delete dataset (id=${id})`)
    process.exit(1)
  }

  console.log(`dataset (id=${id}) deleted successfully`)
}
