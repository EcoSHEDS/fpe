const createError = require('http-errors')
const { v4: uuidv4 } = require('uuid')

const { batch, invokeWorker, createPresignedPostPromise } = require('../aws')
const { Station, Imageset } = require('../db/models')

const attachPublicImageset = async (req, res, next) => {
  const row = await Imageset.query()
    .withGraphFetched('images(defaultSelect,defaultOrderBy,excludePii)')
    .findById(req.params.imagesetId)

  if (!row) {
    throw createError(404, `Imageset not found (id=${req.params.imagesetId})`)
  }

  res.locals.imageset = row
  return next()
}

const attachRestrictedImageset = async (req, res, next) => {
  const row = await Imageset.query()
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

  // const presignedUrl = await createPresignedPostPromise({
  //   Bucket: process.env.BUCKET,
  //   Conditions: [
  //     ['starts-with', '$key', `imagesets/${props.uuid}/images/`]
  //   ],
  //   Expires: 60 * 60 * 24 // 24 hours
  // })
  // presignedUrl.fields.key = `imagesets/${props.uuid}/images/`

  const rows = await Station.relatedQuery('imagesets')
    .for(res.locals.station.id)
    .insert([props])
    .returning('*')

  const row = rows[0]
  // row.presignedUrl = presignedUrl
  return res.status(201).json(row)
}

const presignImageset = async (req, res, next) => {
  const presignedUrl = await createPresignedPostPromise({
    Bucket: process.env.BUCKET,
    Conditions: [
      ['starts-with', '$key', `imagesets/${res.locals.imageset.uuid}/images/`]
    ],
    Expires: 60 * 60 * 24 // 24 hours
  })
  presignedUrl.fields.key = `imagesets/${res.locals.imageset.uuid}/images/`

  return res.status(201).json(presignedUrl)
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
    jobDefinition: process.env.JOB_DEFINITION_PROCESSOR,
    jobQueue: process.env.JOB_QUEUE,
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

const piiImageset = async (req, res, next) => {
  console.log(`run pii detector on imageset (id=${res.locals.imageset.id})`)

  const response = await batch.submitJob({
    jobName: `pii-imageset-${res.locals.imageset.id}`,
    jobDefinition: process.env.JOB_DEFINITION_PII,
    jobQueue: process.env.JOB_QUEUE,
    containerOverrides: {
      command: [
        'python',
        'detect-imageset.py',
        imageset.id.toString()
      ]
    }
  }).promise()

  await res.locals.imageset.$query().patch({ pii_status: 'QUEUED' })

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
  const response = await invokeWorker({
    method: 'listS3Objects',
    prefix: `imagesets/${res.locals.imageset.uuid}`
  })

  return res.status(200).json(response)
}

module.exports = {
  attachPublicImageset,
  attachRestrictedImageset,
  getImagesets,
  getImageset,
  postImagesets,
  putImageset,
  deleteImageset,
  deleteImagesetFiles,
  presignImageset,
  processImageset,
  piiImageset,
  listImagesetFiles
}
