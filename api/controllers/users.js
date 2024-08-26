const createError = require('http-errors')

const { stationsQuery } = require('./stations')
const knex = require('../db/knex')
const { User, Station } = require('../db/models')

const attachUser = async (req, res, next) => {
  const row = await User.query()
    .findById(req.params.userId)
  if (!row) throw createError(404, `User (id = ${req.params.userId}) not found`)
  res.locals.user = row
  return next()
}

const getUser = async (req, res, next) => {
  return res.status(200).json(res.locals.user)
}

const postUser = async (req, res, next) => {
  if (req.body.id !== res.locals.user.id) throw createError(400, `User (id = ${req.body.id}) is not valid`)
  const row = await User.query().insert(req.body).returning('*')
  return res.status(201).json(row)
}

const putUser = async (req, res, next) => {
  const row = await res.locals.user.$query.patchAndFetch(req.body)
  return res.status(200).json(row)
}

const deleteUser = async (req, res, next) => {
  const nrow = await res.locals.user.$query().delete()
  if (nrow === 0) {
    throw createError(500, `Failed to delete user (id = ${res.locals.user.id})`)
  }

  return res.status(204).json()
}

const getStationsForUser = async (req, res, next) => {
  const rows = await stationsQuery()
    .where(req.query)
    .andWhere('user_id', res.locals.user.id)
  return res.status(200).json(rows)
}

module.exports = {
  attachUser,
  getUser,
  postUser,
  putUser,
  deleteUser,
  getStationsForUser
}
