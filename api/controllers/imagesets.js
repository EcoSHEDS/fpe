const createError = require('http-errors')
const { v4: uuidv4 } = require('uuid')

const { s3, batch, createPresignedPostPromise } = require('../aws')
const { Station, Imageset } = require('../db/models')

const attachImageset = async (req, res, next) => {
  const row = await Imageset.query()
    .modify('imageSummary')
    .withGraphFetched('images(defaultSelect,defaultOrderBy)')
    .findById(req.params.imagesetId)

  if (!row) {
    throw createError(404, `Imageset (id = ${req.params.imagesetId}) not found`)
  }

  res.locals.imageset = row
  return next()
}

const getImagesets = async (req, res, next) => {
  const rows = await Imageset.query()
    .modify('imageSummary')
    .where({ station_id: res.locals.station.id })
  return res.status(200).json(rows)
}

const getImageset = async (req, res, next) => {
  return res.status(200).json(res.locals.imageset)
}

const postImagesets = async (req, res, next) => {
  const props = {
    ...req.body,
    status: 'CREATED',
    uuid: uuidv4()
  }

  const presignedUrl = await createPresignedPostPromise({
    Bucket: process.env.FPE_S3_BUCKET,
    Conditions: [
      ['starts-with', '$key', `imagesets/${props.uuid}/images/`]
    ],
    Expires: 3600
  })
  presignedUrl.fields.key = `imagesets/${props.uuid}/images/`

  const rows = await Station.relatedQuery('imagesets')
    .for(res.locals.station.id)
    .insert([props])
    .returning('*')

  const row = rows[0]
  row.presignedUrl = presignedUrl
  return res.status(201).json(row)
}

const putImageset = async (req, res, next) => {
  const row = await Imageset.query()
    .patchAndFetchById(res.locals.imageset.id, req.body)
  return res.status(200).json(row)
}

const deleteImageset = async (req, res, next) => {
  const nrow = await Imageset.query().deleteById(res.locals.imageset.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete imageset (id = ${res.locals.imageset.id})`)
  }

  res.locals.imageset.images.forEach(image => {
    console.log(`Deleting image (id=${image.id})`)
    let params = {
      Bucket: image.full_s3.Bucket,
      Key: image.full_s3.Key
    }
    s3.deleteObject(params)
      .promise()
      .catch((err) => console.log(err))

    if (image.thumb_s3) {
      console.log(`Deleting image thumb (id=${image.id})`)
      params = {
        Bucket: image.thumb_s3.Bucket,
        Key: image.thumb_s3.Key
      }
      s3.deleteObject(params)
        .promise()
        .catch((err) => console.log(err))
    }
  })

  return res.status(204).json()
}

const processImageset = async (req, res, next) => {
  console.log(`process imageset (id=${res.locals.imageset.id})`)

  const response = await batch.submitJob({
    jobName: `process-imageset-${res.locals.imageset.id}`,
    jobDefinition: 'fpe-batch-job-definition',
    jobQueue: 'fpe-batch-job-queue',
    containerOverrides: {
      command: [
        'node',
        'process.js',
        'imageset',
        res.locals.imageset.id.toString()
      ]
    }
  }).promise()

  await res.locals.imageset.$query().patch({ status: 'QUEUED' })

  return res.status(200).json(response)
}

module.exports = {
  attachImageset,
  getImagesets,
  getImageset,
  postImagesets,
  putImageset,
  deleteImageset,
  processImageset
}
