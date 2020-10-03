const Papa = require('papaparse')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const { Station, Dataset } = require('../db/models')
const { NotFoundError } = require('./lib/errors')
const { fw } = require('./lib/utils')

const { s3, lambda } = require('../aws')

function uploadDatasetToS3 (file, { dryRun, uuid }) {
  if (dryRun) return Promise.resolve({ Location: `http://example.org/${path.basename(file)}` })

  const stream = fs.createReadStream(file)
  return s3.upload({
    Bucket: process.env.FPE_S3_BUCKET,
    Key: `datasets/${uuid}/${path.basename(file)}`,
    Body: stream
  }).promise()
}

function deleteFromS3 ({ Bucket, Key }) {
  return s3.deleteObject({
    Bucket,
    Key
  }).promise()
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
    rows.forEach(row => console.log(`${fw(row.id, 4)} | ${fw(row.station_id, 10)} | ${fw(path.basename(row.url), 24)}`))
  }
}

exports.createDataset = async function (filename, options) {
  console.log(`
Create dataset
        filename: ${filename}
      station id: ${options.station}
timestamp column: ${options.timestamp}
variable column(s): ${options.variable}
  `)

  // generate uuid
  const uuid = uuidv4()

  // create config
  const config = {
    columns: {
      timestamp: options.timestamp,
      variables: options.variable.map(v => {
        const [column, variable] = v.split('=')
        return { column, variable_id: variable }
      })
    }
  }

  // get station
  const station = await Station.query().findById(options.station)
  if (!station) {
    throw new NotFoundError(`Station (id=${options.station}) does not exist`)
  }

  // upload to s3
  const uploaded = await uploadDatasetToS3(filename, { dryRun: options.dryRun, uuid })
  console.log(`dataset uploaded to s3 (Key=${uploaded.Key})`)

  // create dataset object
  const props = {
    s3: {
      Bucket: uploaded.Bucket,
      Key: uploaded.Key
    },
    url: uploaded.Location,
    config,
    status: 'CREATED',
    uuid
  }

  // save to database
  const dataset = await station.$relatedQuery('datasets').insertGraph(props).returning('*')
  console.log(`dataset saved to db (id=${dataset.id})`)

  // trigger processor
  console.log('processing dataset')
  const results = await lambda.invoke({
    FunctionName: 'fpe-lambda-dataset',
    Payload: JSON.stringify({ id: dataset.id, client: 'cli' })
  }).promise()

  // console.log(results)
  if (results.FunctionError) {
    console.log('failed to process dataset')
    console.error(JSON.parse(results.Payload))
    console.log('deleting file from s3')
    await deleteFromS3(uploaded)
    console.log('deleting dataset from database')
    await dataset.$query().delete()
  } else {
    console.log('dataset processed')
  }
}

exports.deleteDataset = async function (id) {
  console.log(`
Delete dataset
  id: ${id}
  `)

  const dataset = await Dataset.query().findById(id)
  if (!dataset) {
    console.error(`Error: Dataset not found (id=${id})`)
    process.exit(1)
  }

  console.log('deleting file from s3')
  await deleteFromS3(dataset.s3)

  const nrow = await dataset.$query().delete()
  if (nrow === 0) {
    console.error(`Error: Failed to delete dataset (id=${id})`)
    process.exit(1)
  }

  console.log(`dataset (id=${id}) deleted successfully`)
}
