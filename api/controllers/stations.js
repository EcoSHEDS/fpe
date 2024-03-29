const createError = require('http-errors')
// const { rollup } = require('d3-array')

const knex = require('../db/knex')
const { deleteDatasetFiles } = require('./datasets')
const { deleteImagesetFiles } = require('./imagesets')
const { Station } = require('../db/models')

const stationsQuery = function () {
  return Station.query()
    .select('stations.*', 'user.affiliation_code', 'user.affiliation_name', 'i.images', 'v.variables')
    .leftJoinRelated('user')
    .leftJoin(
      knex.raw('stations_summary_images as i'),
      'stations.id',
      'i.station_id'
    )
    .leftJoin(
      knex.raw('stations_summary_variables as v'),
      'stations.id',
      'v.station_id'
    )
}

const attachStation = async (req, res, next) => {
  const row = await Station.query()
    .findById(req.params.stationId)
    .select('stations.*', 'user.affiliation_code', 'user.affiliation_name')
    .leftJoinRelated('user')
    // .withGraphFetched('[datasets, imagesets]')
  if (!row) throw createError(404, `Station (id = ${req.params.stationId}) not found`)
  res.locals.station = row
  return next()
}

const getPublicStations = async (req, res, next) => {
  const rows = await stationsQuery()
    .where(req.query)
    .andWhere('private', false)
  return res.status(200).json(rows)
}

const getAllStations = async (req, res, next) => {
  const rows = await stationsQuery()
    .where(req.query)
    .debug(true)
  return res.status(200).json(rows)
}

const postStations = async (req, res, next) => {
  const existing = await Station.query()
    .where('user_id', req.auth.id)
    .where('name', req.body.name)
  if (existing.length > 0) {
    return res.status(400).json({
      message: `Station names must be unique. "${req.body.name}" already exists.`
    })
  }
  const row = await Station.query().insert(req.body).returning('*')
  return res.status(201).json(row)
}

const getStation = async (req, res, next) => {
  const results = await knex.raw(
    'select * from f_station_summary(?)',
    [res.locals.station.id]
  )
  delete res.locals.station.datasets
  delete res.locals.station.imagesets
  res.locals.station.summary = results.rows[0]
  return res.status(200).json(res.locals.station)
}

const putStation = async (req, res, next) => {
  if (req.body.name) {
    const existing = await Station.query()
      .where('user_id', req.auth.id)
      .where('name', req.body.name)
    if (existing.length > 0 && existing[0].id !== res.locals.station.id) {
      return res.status(400).json({
        message: `Station names must be unique. "${req.body.name}" already exists.`
      })
    }
  }
  const row = await Station.query().patchAndFetchById(res.locals.station.id, req.body)
  return res.status(200).json(row)
}

const deleteStation = async (req, res, next) => {
  const nrow = await Station.query().deleteById(res.locals.station.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete station (id = ${res.locals.station.id})`)
  }

  await deleteStationFiles(res.locals.station)

  return res.status(204).json()
}

const deleteStationFiles = async ({ datasets, imagesets }) => {
  if (datasets) {
    for (let i = 0; i < datasets.length; i++) {
      await deleteDatasetFiles(datasets[i])
    }
  }
  if (imagesets) {
    for (let i = 0; i < imagesets.length; i++) {
      await deleteImagesetFiles(imagesets[i])
    }
  }
}

const getStationDaily = async (req, res, next) => {
  const result = await knex.raw(
    'select * from f_station_daily(?)',
    [res.locals.station.id]
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

const getStationDailyValues = async (req, res, next) => {
  const variableId = req.query.variableId
  if (!variableId) throw createError(400, 'Query parameter \'variableId\' missing')
  const start = req.query.start
  if (!start) throw createError(400, 'Query parameter \'start\' missing')
  const end = req.query.end
  if (!end) throw createError(400, 'Query parameter \'end\' missing')
  const result = await knex.raw(
    'select * from f_station_daily_values_variable(?, ?, ?, ?)',
    [res.locals.station.id, variableId, start, end]
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

const getStationDailyImages = async (req, res, next) => {
  const result = await knex.raw(
    'select * from f_station_daily_images(?)',
    [res.locals.station.id]
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

const getStationImages = async (req, res, next) => {
  const result = await knex.raw(
    'select * from f_station_images(?,?,?)',
    [res.locals.station.id, req.query.start, req.query.end]
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

const getStationValues = async (req, res, next) => {
  const result = await knex.raw(
    'select * from f_station_values(?,?,?,?)',
    [res.locals.station.id, req.query.variable, req.query.start, req.query.end]
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

const getStationRandomImagePairs = async (req, res, next) => {
  const n_pairs = Math.min(req.query.n_pairs || 100, 10000)
  const result = await knex.raw(
    'select * from f_station_random_image_pairs(?,?,?,?)',
    [res.locals.station.id, n_pairs, 7, 18]
  )
  const rows = result.rows
  return res.status(200).json(rows)
}

module.exports = {
  getPublicStations,
  getAllStations,
  postStations,

  attachStation,
  getStation,
  putStation,
  deleteStation,

  getStationImages,
  getStationValues,

  getStationDaily,
  getStationDailyValues,
  getStationDailyImages,

  getStationRandomImagePairs
}
