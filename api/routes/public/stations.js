const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachStation,
  getStations,
  getStation,
  getStationDaily,
  getStationImages,
  getStationValues
} = require('../../controllers/stations')
const {
  attachDataset,
  getDatasets,
  getDataset,
  listDatasetFiles
} = require('../../controllers/datasets')
const {
  attachImageset,
  getImagesets,
  getImageset,
  listImagesetFiles
} = require('../../controllers/imagesets')
const {
  getImages
} = require('../../controllers/images')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getStations))

router.route('/:stationId')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStation))

router.route('/:stationId/daily')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationDaily))

router.route('/:stationId/images')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationImages))

router.route('/:stationId/values')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationValues))

router.route('/:stationId/datasets')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getDatasets))

router.route('/:stationId/datasets/:datasetId')
  .all(asyncHandler(attachStation), asyncHandler(attachDataset))
  .get(asyncHandler(getDataset))

router.route('/:stationId/datasets/:datasetId/process')
  .all(asyncHandler(attachStation), asyncHandler(attachDataset))

router.route('/:stationId/datasets/:datasetId/list')
  .all(asyncHandler(attachStation), asyncHandler(attachDataset))
  .get(asyncHandler(listDatasetFiles))

router.route('/:stationId/imagesets')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getImagesets))

router.route('/:stationId/imagesets/:imagesetId')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset))
  .get(asyncHandler(getImageset))

router.route('/:stationId/imagesets/:imagesetId/process')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset))

router.route('/:stationId/imagesets/:imagesetId/images')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset))
  .get(asyncHandler(getImages))

router.route('/:stationId/imagesets/:imagesetId/list')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset))
  .get(asyncHandler(listImagesetFiles))

module.exports = router
