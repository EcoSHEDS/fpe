const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const { Station, Dataset } = require('../db/models')
const { NotFoundError } = require('./lib/errors')
const { printTable } = require('./lib/utils')

const { s3, batch } = require('./lib/aws')

function uploadDatasetToS3 (file, { dryRun, uuid }) {
  if (dryRun) return Promise.resolve({ Location: `http://example.org/${path.basename(file)}` })

  const stream = fs.createReadStream(file)
  return s3.upload({
    Bucket: process.env.BUCKET,
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
  let query = Dataset.query().orderBy(['id'])
  if (options.station) {
    query = query.where({ station_id: options.station })
  }
  const rows = await query

  if (rows.length === 0) {
    console.log('No datasets found')
  } else {
    printTable(rows, ['id', 'station_id', 'uuid', 'filename'])
  }
}

exports.createDataset = async function (filename, options) {
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
  const uploaded = await uploadDatasetToS3(filename, {
    dryRun: options.dryRun,
    uuid
  })
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
  const row = await station.$relatedQuery('datasets')
    .insertGraph(props).returning('*')
  printTable([row], ['id', 'station_id', 'uuid', 'filename'])
}

exports.processDataset = async function (id) {
  const dataset = await Dataset.query().findById(id)
  if (!dataset) {
    console.error(`Error: Dataset not found (id=${id})`)
    process.exit(1)
  }

  const results = await batch.submitJob({
    jobName: 'process-dataset',
    jobDefinition: process.env.JOB_DEFINITION_PROCESSOR,
    jobQueue: process.env.JOB_QUEUE,
    containerOverrides: {
      command: [
        'node',
        'process.js',
        'dataset',
        '-i',
        id
      ]
    }
  }).promise()
  console.log(`batch job submitted (jobId: ${results.jobId})`)
}

exports.deleteDataset = async function (id) {
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
