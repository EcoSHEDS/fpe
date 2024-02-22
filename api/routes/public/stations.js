const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachStation,
  getPublicStations,
  getStation,
  getStationImages,
  getStationValues,
  getStationDaily,
  getStationDailyImages,
  getStationDailyValues,
  getStationRandomImagePairs,
  getStationModels
} = require('../../controllers/stations')
const {
  attachDataset,
  getDatasets,
  getDataset,
  listDatasetFiles
} = require('../../controllers/datasets')
const {
  attachPublicImageset,
  getImagesets,
  getImageset,
  listImagesetFiles
} = require('../../controllers/imagesets')
const {
  getImages
} = require('../../controllers/images')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getPublicStations))

router.route('/:stationId')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStation))

router.route('/:stationId/daily')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationDaily))

router.route('/:stationId/daily/values')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationDailyValues))

router.route('/:stationId/daily/images')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationDailyImages))

router.route('/:stationId/images')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationImages))

router.route('/:stationId/image-pairs')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationRandomImagePairs))

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
  .all(asyncHandler(attachStation), asyncHandler(attachPublicImageset))
  .get(asyncHandler(getImageset))

router.route('/:stationId/imagesets/:imagesetId/process')
  .all(asyncHandler(attachStation), asyncHandler(attachPublicImageset))

router.route('/:stationId/imagesets/:imagesetId/images')
  .all(asyncHandler(attachStation), asyncHandler(attachPublicImageset))
  .get(asyncHandler(getImages))

router.route('/:stationId/imagesets/:imagesetId/list')
  .all(asyncHandler(attachStation), asyncHandler(attachPublicImageset))
  .get(asyncHandler(listImagesetFiles))

router.route('/:stationId/models')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationModels))

module.exports = router
