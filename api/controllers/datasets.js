const createError = require('http-errors')
const { v4: uuidv4 } = require('uuid')

const { batch, invokeWorker, createPresignedPostPromise } = require('../aws')
const { Station, Dataset } = require('../db/models')

const attachDataset = async (req, res, next) => {
  const row = await Dataset.query().findById(req.params.datasetId)
  if (!row) throw createError(404, `Dataset (id=${req.params.datasetId}) not found`)
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
    .withGraphFetched('variable')
  return res.status(200).json(res.locals.dataset)
}

const postDatasets = async (req, res, next) => {
  const props = {
    ...req.body,
    status: 'CREATED',
    uuid: uuidv4()
  }

  const presignedUrl = await createPresignedPostPromise({
    Bucket: process.env.BUCKET,
    Fields: {
      key: `datasets/${props.uuid}/${req.body.filename}`
    },
    Expires: 60 * 60 * 24 // 24 hours
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

const processDataset = async (req, res, next) => {
  // console.log(`process dataset (id=${res.locals.dataset.id})`)
  const response = await batch.submitJob({
    jobName: `process-dataset-${res.locals.dataset.id}`,
    jobDefinition: process.env.JOB_DEFINITION_PROCESSOR,
    jobQueue: process.env.JOB_QUEUE,
    containerOverrides: {
      command: [
        'node',
        'process.js',
        'dataset',
        res.locals.dataset.id.toString()
      ]
    }
  }).promise()

  await res.locals.dataset.$query().patch({ status: 'QUEUED' })

  return res.status(200).json(response)
}

const deleteDataset = async (req, res, next) => {
  const nrow = await Dataset.query().deleteById(res.locals.dataset.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete dataset (id=${res.locals.dataset.id})`)
  }

  await deleteDatasetFiles(res.locals.dataset)

  res.status(204).json()
}

const deleteDatasetFiles = async (dataset) => {
  try {
    const response = await invokeWorker({
      method: 'deleteS3Objects',
      prefix: `datasets/${dataset.uuid}`
    })
    return response
  } catch (err) {
    console.log(`Failed to delete dataset files on s3 (id=${dataset.id})`)
    console.error(err)
  }
}

const listDatasetFiles = async (req, res, next) => {
  const response = await invokeWorker({
    method: 'listS3Objects',
    prefix: `datasets/${res.locals.dataset.uuid}`
  })

  return res.status(200).json(response)
}

module.exports = {
  attachDataset,
  getDataset,
  getDatasets,
  postDatasets,
  putDataset,
  deleteDataset,
  deleteDatasetFiles,
  processDataset,
  listDatasetFiles
}
