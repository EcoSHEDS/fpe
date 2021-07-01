const createError = require('http-errors')

const { User } = require('../db/models')

const getUser = async (req, res, next) => {
  const row = await User.query().findById(req.params.userId)
  if (!row) throw createError(404, `User (id = ${req.params.userId}) not found`)
  return res.status(200).json(row)
}

const postUser = async (req, res, next) => {
  if (req.body.id !== req.params.userId) throw createError(400, `User (id = ${req.body.id}) is not valid`)
  const row = await User.query().insert(req.body).returning('*')
  return res.status(201).json(row)
}

const putUser = async (req, res, next) => {
  const row = await User.query().patchAndFetchById(req.params.userId, req.body)
  return res.status(200).json(row)
}

const deleteUser = async (req, res, next) => {
  const nrow = await User.query().deleteById(req.params.userId)
  if (nrow === 0) {
    throw createError(500, `Failed to delete user (id = ${req.params.userId})`)
  }

  return res.status(204).json()
}

module.exports = {
  getUser,
  postUser,
  putUser,
  deleteUser
}
