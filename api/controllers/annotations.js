const { v4: uuidv4 } = require('uuid')

const { createPresignedPostPromise, notify } = require('../aws')
const { Annotation, Station, User } = require('../db/models')
const { fetchUser, transformUserAttributes } = require('./admin/users')

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

function newTrainingMessage (annotation, user) {
  const d = annotation.created_at
  return `New annotation training completed

Submitted: ${d.toLocaleString('en-US', { timeZone: 'America/New_York' })}

User ID: ${user.id}
Name: ${user.name}
Email: ${user.email}
Affiliation: ${user.affiliation_name} (${user.affiliation_code})

Annotation ID: ${annotation.id}
Station ID: ${annotation.station_id}
URL: ${annotation.url}
`
}

const putAnnotation = async (req, res, next) => {
  const row = await Annotation.query()
    .patchAndFetchById(res.locals.annotation.id, req.body)

  if (row.training) {
    const userId = row.user_id
    const cognitoUser = await fetchUser(userId)
    const attributes = transformUserAttributes(cognitoUser.UserAttributes)
    const dbUser = await User.query().findById(userId)
    const user = {
      ...dbUser,
      ...attributes
    }
    const message = newTrainingMessage(row, user)
    await notify('Annotation Training Completed', message)
  }
  return res.status(200).json(row)
}

const getAnnotationStations = async (req, res, next) => {
  const userId = req.auth.id

  const ownerStations = await Station.query()
    .modify('annotationSummary')
    .where('private', false)
    .orWhere('user_id', '=', userId)

  const collaboratorStations = await Station.query()
    .modify('annotationSummary')
    .join('stations_permissions', 'stations.id', 'stations_permissions.station_id')
    .select('stations.*')
    .where('stations_permissions.user_id', userId)

  const allStations = [...ownerStations, ...collaboratorStations]
  const uniqueStations = allStations.filter((station, index, self) =>
    index === self.findIndex((t) => t.id === station.id)
  )

  uniqueStations.forEach(d => {
    d.n_annotations = Number(d.n_annotations) || 0
    d.n_annotations_daytime = Number(d.n_annotations_daytime) || 0
  })
  return res.status(200).json(uniqueStations)
}

const getAdminAnnotationStations = async (req, res, next) => {
  const rows = await Station.query()
    .modify('annotationSummary')

  rows.forEach(d => {
    d.n_annotations = Number(d.n_annotations) || 0
    d.n_annotations_daytime = Number(d.n_annotations_daytime) || 0
  })
  return res.status(200).json(rows)
}

const getAnnotationTraining = async (req, res, next) => {
  const url = `https://${process.env.BUCKET}.s3.amazonaws.com/training/training.json`
  return res.status(200).json({ url })
}

module.exports = {
  attachAnnotation,
  postAnnotations,
  getAnnotation,
  putAnnotation,
  getAnnotationStations,
  getAdminAnnotationStations,
  getAnnotationTraining
}
