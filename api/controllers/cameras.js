const createError = require('http-errors')

const { Camera } = require('../../db/models')

const getCameras = async (req, res, next) => {
  const rows = await Camera.query().where(req.query)
  return res.status(200).json(rows)
}

const postCameras = async (req, res, next) => {
  const row = await Camera.query().insert(req.body).returning('*')
  return res.status(201).json(row)
}

const attachCamera = async (req, res, next) => {
  const row = await Camera.query().findById(req.params.cameraId).withGraphFetched('[imagesets]')
  if (!row) throw createError(404, `Camera (id = ${req.params.cameraId}) not found`)
  res.locals.camera = row
  return next()
}

const isOwner = (req, res, next) => {
  if (!res.locals.camera || !res.locals.user || res.locals.camera.user_id !== res.locals.user.id) {
    return next(createError(401, 'Not authorized'))
  }
  next()
}

const getCamera = async (req, res, next) => {
  return res.status(200).json(res.locals.camera)
}

const putCamera = async (req, res, next) => {
  const row = await Camera.query().patchAndFetchById(res.locals.camera.id, res.body)
  return res.status(200).json(row)
}

const deleteCamera = async (req, res, next) => {
  const nrow = await Camera.deleteById(res.locals.camera.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete camera (id = ${res.locals.camera.id})`)
  }
  return res.status(204).json()
}

module.exports = {
  getCameras,
  postCameras,

  attachCamera,
  getCamera,
  putCamera,
  deleteCamera,

  isOwner
}
