const createError = require('http-errors')

const { User } = require('../db/models')

const getUser = async (req, res, next) => {
  const row = await User.query()
    .findById(res.locals.user.id)
  if (!row) throw createError(404, `User (id = ${req.params.userId}) not found`)
  return res.status(200).json(row)
}

const postUser = async (req, res, next) => {
  const body = req.body
  body.id = res.locals.user.id
  const row = await User.query().insert(body).returning('*')
  return res.status(201).json(row)
}

const putUser = async (req, res, next) => {
  const row = await User.query().patchAndFetchById(res.locals.user.id, req.body)
  return res.status(200).json(row)
}

const deleteUser = async (req, res, next) => {
  const nrow = await User.query().deleteById(res.locals.user.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete user (id = ${res.locals.user.id})`)
  }

  return res.status(204).json()
}

module.exports = {
  getUser,
  postUser,
  putUser,
  deleteUser
}
