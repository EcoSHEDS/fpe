const createError = require('http-errors')
const { v4: uuidv4 } = require('uuid')

const { s3, lambda, createPresignedPostPromise } = require('../../aws')
const { Station, Dataset, Imageset, Camera } = require('../../db/models')

const getStations = async (req, res, next) => {
  const rows = await Station.query().where(req.query)
  return res.status(200).json(rows)
}

const postStations = async (req, res, next) => {
  const row = await Station.query().insert(req.body).returning('*')
  return res.status(201).json(row)
}

const attachStation = async (req, res, next) => {
  const row = await Station.query().findById(req.params.stationId).withGraphFetched('[user, datasets, imagesets]')
  if (!row) throw createError(404, `Station (id = ${req.params.stationId}) not found`)
  res.locals.station = row
  return next()
}

const isOwner = (req, res, next) => {
  if (!res.locals.station || !res.locals.user || res.locals.station.user_id !== res.locals.user.id) {
    return next(createError(401, 'Not authorized'))
  }
  next()
}

const getStation = async (req, res, next) => {
  return res.status(200).json(res.locals.station)
}

const putStation = async (req, res, next) => {
  const row = await Station.query().patchAndFetchById(res.locals.station.id, req.body)
  return res.status(200).json(row)
}

const deleteStation = async (req, res, next) => {
  const nrow = await Station.query().deleteById(res.locals.station.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete station (id = ${res.locals.station.id})`)
  }
  return res.status(204).json()
}

const getDatasets = async (req, res, next) => {
  const rows = await Dataset.query().where({ station_id: res.locals.station.id })
  return res.status(200).json(rows)
}

const postDatasets = async (req, res, next) => {
  // await Station.query().insert(req.body).returning('*')

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

const attachDataset = async (req, res, next) => {
  const row = await Dataset.query().findById(req.params.datasetId)
  if (!row) throw createError(404, `Dataset (id = ${req.params.datasetId}) not found`)
  res.locals.dataset = row
  return next()
}

const getDataset = async (req, res, next) => {
  res.locals.dataset.series = await res.locals.dataset.$relatedQuery('series').withGraphFetched('observations')
  return res.status(200).json(res.locals.dataset)
}

const putDataset = async (req, res, next) => {
  const row = await Dataset.query().patchAndFetchById(res.locals.dataset.id, req.body)
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
    Bucket: process.env.FPE_S3_BUCKET,
    Key: `datasets/${res.locals.dataset.uuid}/${res.locals.dataset.filename}`
  }
  await s3.deleteObject(params).promise()

  return res.status(204).json()
}

const processDataset = async (req, res, next) => {
  const response = await lambda.invoke({
    FunctionName: 'fpe-lambda-dataset',
    InvocationType: 'Event',
    Payload: JSON.stringify({ id: res.locals.dataset.id, client: 'api' })
  }).promise()

  return res.status(200).json(response)
}

const getImagesets = async (req, res, next) => {
  const rows = await Imageset.query().where({ station_id: res.locals.station.id })
  return res.status(200).json(rows)
}

const postImagesets = async (req, res, next) => {
  const camera = await Camera.query().findById(req.body.camera_id)
  if (!camera) throw createError(400, `Camera must be assigned to this Imageset (camera_id=${req.body.camera_id})`)

  const props = {
    ...req.body,
    status: 'CREATED'
  }

  await Station.query().insert(req.body).returning('*')
  const row = await Station.relatedQuery('imagesets')
    .for(res.locals.station.id)
    .insert([props])
    .returning('*')
  return res.status(201).json(row)
}

const attachImageset = async (req, res, next) => {
  const row = await Imageset.query().findById(req.params.imagesetId).withGraphFetched('images')
  if (!row) throw createError(404, `Imageset (id = ${req.params.imagesetId}) not found`)
  res.locals.imageset = row
  return next()
}

const getImageset = async (req, res, next) => {
  return res.status(200).json(res.locals.imageset)
}

const putImageset = async (req, res, next) => {
  const row = await Imageset.query().patchAndFetchById(res.locals.imageset.id, req.body)
  return res.status(200).json(row)
}

const deleteImageset = async (req, res, next) => {
  const nrow = await Imageset.query().deleteById(res.locals.imageset.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete imageset (id = ${res.locals.imageset.id})`)
  }
  return res.status(204).json()
}

module.exports = {
  getStations,
  postStations,

  attachStation,
  getStation,
  putStation,
  deleteStation,

  getDatasets,
  postDatasets,

  attachDataset,
  getDataset,
  putDataset,
  deleteDataset,
  processDataset,

  getImagesets,
  postImagesets,

  attachImageset,
  getImageset,
  putImageset,
  deleteImageset,

  isOwner
}
