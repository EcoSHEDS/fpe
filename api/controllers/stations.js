const createError = require('http-errors')
const { rollup } = require('d3-array')

const { deleteDatasetFiles } = require('./datasets')
const { deleteImagesetFiles } = require('./imagesets')
const { Station } = require('../db/models')

const attachStation = async (req, res, next) => {
  const row = await Station.query()
    .findById(req.params.stationId)
    .select('stations.*', 'user.affiliation_name', 'user.affiliation_description')
    .leftJoinRelated('user')
    .withGraphFetched('[datasets, imagesets]')
  if (!row) throw createError(404, `Station (id = ${req.params.stationId}) not found`)
  res.locals.station = row
  return next()
}

const getStations = async (req, res, next) => {
  const rows = await Station.query()
    .select('stations.*', 'user.affiliation_name', 'user.affiliation_description')
    .leftJoinRelated('user')
    .where(req.query)
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

  await deleteStationFiles(res.locals.station)

  return res.status(204).json()
}

const deleteStationFiles = async ({ datasets, imagesets }) => {
  for (let i = 0; i < datasets.length; i++) {
    await deleteDatasetFiles(datasets[i])
  }
  for (let i = 0; i < imagesets.length; i++) {
    await deleteImagesetFiles(imagesets[i])
  }
}

const getStationDaily = async (req, res, next) => {
  const data = await res.locals.station
    .$query()
    .withGraphFetched('[datasets(done).series.values(daily),imagesets(imageSummary,done).images(daily)]')

  const aggregate = v => {
    const mid = Math.floor(v.length / 2)
    return {
      n_images: v.length,
      image: v[mid]
    }
  }
  data.imagesets.forEach(d => {
    d.images = Array.from(
      rollup(d.images, aggregate, d => d.date),
      ([key, value]) => ({ date: key, ...value })
    )
  })
  return res.status(200).json(data)
}

module.exports = {
  getStations,
  postStations,

  attachStation,
  getStation,
  putStation,
  deleteStation,

  getStationDaily
}
