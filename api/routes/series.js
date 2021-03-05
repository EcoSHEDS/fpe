const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachSeries,
  getSeries,
  getSeriesValues,
  getSeriesDaily
} = require('../controllers/series')

var router = express.Router()

router.route('/:seriesId')
  .all(asyncHandler(attachSeries))
  .get(asyncHandler(getSeries))

router.route('/:seriesId/values')
  .all(asyncHandler(attachSeries))
  .get(asyncHandler(getSeriesValues))

router.route('/:seriesId/daily')
  .all(asyncHandler(attachSeries))
  .get(asyncHandler(getSeriesDaily))

module.exports = router
