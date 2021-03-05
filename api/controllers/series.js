const createError = require('http-errors')
const { Series } = require('../db/models')

const attachSeries = async (req, res, next) => {
  const row = await Series.query()
    .findById(req.params.seriesId)
    .withGraphFetched('variable')
  if (!row) throw createError(404, `Series (id = ${req.params.seriesId}) not found`)
  res.locals.series = row
  return next()
}

const getSeries = async (req, res, next) => {
  return res.status(200).json(res.locals.series)
}

const getSeriesValues = async (req, res, next) => {
  const values = await res.locals.series
    .$relatedQuery('values')
    .modify('defaultOrderBy')
    .modify('defaultSelect')
  return res.status(200).json(values)
}

const getSeriesDaily = async (req, res, next) => {
  const daily = await res.locals.series
    .$relatedQuery('values')
    .modify('daily')
  return res.status(200).json(daily)
}

module.exports = {
  attachSeries,
  getSeries,
  getSeriesValues,
  getSeriesDaily
}
