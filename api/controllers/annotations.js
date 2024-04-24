const { v4: uuidv4 } = require('uuid')

const { createPresignedPostPromise } = require('../aws')
const { Annotation, Station } = require('../db/models')

const attachAnnotation = async (req, res, next) => {
  const row = await Annotation.query().findById(req.params.annotationId)
  if (!row) throw createError(404, `Annotation (id=${req.params.annotationId}) not found`)
  res.locals.annotation = row
  return next()
}

const getAnnotation = async (req, res, next) => {
  return res.status(200).json(res.locals.annotation)
}

const postAnnotations = async (req, res, next) => {
  const props = {
    ...req.body,
    status: 'CREATED',
    uuid: uuidv4()
  }

  const presignedUrl = await createPresignedPostPromise({
    Bucket: process.env.BUCKET,
    Fields: {
      key: `annotations/${props.uuid}.json`
    },
    Expires: 60 * 60 * 1 // one hour
  })
  props.s3 = {
    Bucket: presignedUrl.fields.bucket,
    Key: presignedUrl.fields.key
  }

  const row = await Annotation.query()
    .insert(props)
    .returning('*')
  row.presignedUrl = presignedUrl
  return res.status(201).json(row)
}

const putAnnotation = async (req, res, next) => {
  const row = await Annotation.query()
    .patchAndFetchById(res.locals.annotation.id, req.body)
  return res.status(200).json(row)
}

const getAnnotationStations = async (req, res, next) => {
  const userId = req.auth.id

  const rows = await Station.query()
    .modify('annotationSummary')
    .where('private', false)
    .orWhere('user_id', '=', userId)

  rows.forEach(d => {
    d.n_annotations = Number(d.n_annotations) || 0
    d.n_annotations_daytime = Number(d.n_annotations_daytime) || 0
  })
  return res.status(200).json(rows)
}

module.exports = {
  attachAnnotation,
  postAnnotations,
  getAnnotation,
  putAnnotation,
  getAnnotationStations
}