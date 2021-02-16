const createError = require('http-errors')

const { Station } = require('../db/models')

const attachStation = async (req, res, next) => {
  const row = await Station.query()
    .findById(req.params.stationId)
    .withGraphFetched('[datasets, imagesets]')
  if (!row) throw createError(404, `Station (id = ${req.params.stationId}) not found`)
  res.locals.station = row
  return next()
}

const getStations = async (req, res, next) => {
  const rows = await Station.query().where(req.query)
  return res.status(200).json(rows)
}

const postStations = async (req, res, next) => {
  const row = await Station.query().insert(req.body).returning('*')
  return res.status(201).json(row)
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

module.exports = {
  getStations,
  postStations,

  attachStation,
  getStation,
  putStation,
  deleteStation
}
