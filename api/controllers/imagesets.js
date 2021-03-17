const createError = require('http-errors')
const { v4: uuidv4 } = require('uuid')

const { batch, invokeWorker, createPresignedPostPromise } = require('../aws')
const { Station, Imageset } = require('../db/models')

const attachImageset = async (req, res, next) => {
  const row = await Imageset.query()
    .modify('imageSummary')
    .withGraphFetched('images(defaultSelect,defaultOrderBy)')
    .findById(req.params.imagesetId)

  if (!row) {
    throw createError(404, `Imageset not found (id=${req.params.imagesetId})`)
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
    Expires: 60 * 60 * 6 // 6 hours
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

const deleteImageset = async (req, res, next) => {
  const nrow = await Imageset.query().deleteById(res.locals.imageset.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete imageset (id=${res.locals.imageset.id})`)
  }

  await deleteImagesetFiles(res.locals.imageset)

  return res.status(204).json()
}

const deleteImagesetFiles = async (imageset) => {
  try {
    const response = await invokeWorker({
      method: 'deleteS3Objects',
      prefix: `imagesets/${imageset.uuid}`
    })
    return response
  } catch (err) {
    console.log(`Failed to delete imageset files on s3 (id=${imageset.id})`)
    console.error(err)
  }
}

const listImagesetFiles = async (req, res, next) => {
  let keys = []
  try {
    keys = await listS3Objects(`imagesets/${res.locals.imageset.uuid}`)
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      message: `Failed to list imageset files on s3 (id=${res.locals.imageset.id}, uuid=${res.locals.imageset.uuid})`
    })
  }

  return res.status(200).json(keys)
}

module.exports = {
  attachImageset,
  getImagesets,
  getImageset,
  postImagesets,
  putImageset,
  deleteImageset,
  deleteImagesetFiles,
  processImageset,
  listImagesetFiles
}
