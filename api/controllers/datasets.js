const createError = require('http-errors')
const { v4: uuidv4 } = require('uuid')

const { s3, batch, createPresignedPostPromise } = require('../aws')
const { Station, Dataset } = require('../db/models')

const attachDataset = async (req, res, next) => {
  const row = await Dataset.query().findById(req.params.datasetId)
  if (!row) throw createError(404, `Dataset (id = ${req.params.datasetId}) not found`)
  res.locals.dataset = row
  return next()
}

const getDatasets = async (req, res, next) => {
  const rows = await Dataset.query()
    .where({ station_id: res.locals.station.id })
  return res.status(200).json(rows)
}

const getDataset = async (req, res, next) => {
  res.locals.dataset.series = await res.locals.dataset.$relatedQuery('series')
    .withGraphFetched('observations')
  return res.status(200).json(res.locals.dataset)
}

const postDatasets = async (req, res, next) => {
  const props = {
    config: req.body.config,
    status: 'CREATED',
    uuid: uuidv4()
  }

  const presignedUrl = await createPresignedPostPromise({
    Bucket: process.env.FPE_S3_BUCKET,
    Fields: {
      key: `datasets/${props.uuid}/${req.body.filename}`
    }
  })
  props.s3 = {
    Bucket: presignedUrl.fields.bucket,
    Key: presignedUrl.fields.key
  }

  const rows = await Station.relatedQuery('datasets')
    .for(res.locals.station.id)
    .insert([props])
    .returning('*')

  const row = rows[0]
  row.presignedUrl = presignedUrl
  return res.status(201).json(row)
}

const putDataset = async (req, res, next) => {
  const row = await Dataset.query()
    .patchAndFetchById(res.locals.dataset.id, req.body)
  return res.status(200).json(row)
}

const deleteDataset = async (req, res, next) => {
  // delete database entry
  const nrow = await Dataset.query().deleteById(res.locals.dataset.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete dataset (id = ${res.locals.dataset.id})`)
  }

  // delete file on s3
  const params = {
    Bucket: res.locals.dataset.s3.Bucket,
    Key: res.locals.dataset.s3.Key
  }
  await s3.deleteObject(params).promise()

  return res.status(204).json()
}

const processDataset = async (req, res, next) => {
  console.log(`process dataset (id=${res.locals.dataset.id})`)

  const response = await batch.submitJob({
    jobName: 'process-dataset',
    jobDefinition: 'fpe-batch-job-definition',
    jobQueue: 'fpe-batch-job-queue',
    containerOverrides: {
      command: [
        'node',
        'process.js',
        'dataset',
        '-i',
        res.locals.dataset.id.toString()
      ]
    }
  }).promise()

  await res.locals.dataset.$query().patch({ status: 'QUEUED' })

  return res.status(200).json(response)
}

module.exports = {
  attachDataset,
  getDataset,
  getDatasets,
  postDatasets,
  putDataset,
  deleteDataset,
  processDataset
}
