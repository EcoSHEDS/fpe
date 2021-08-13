const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachStation,
  getStations,
  getStation,
  postStations,
  putStation,
  deleteStation,
  getStationDaily
} = require('../../controllers/stations')
const {
  attachDataset,
  getDatasets,
  getDataset,
  postDatasets,
  putDataset,
  deleteDataset,
  processDataset,
  listDatasetFiles
} = require('../../controllers/datasets')
const {
  attachImageset,
  getImagesets,
  getImageset,
  postImagesets,
  putImageset,
  deleteImageset,
  processImageset,
  listImagesetFiles
} = require('../../controllers/imagesets')
const {
  attachImage,
  getImages,
  postImage,
  deleteImage
} = require('../../controllers/images')
const { requireStationOwnerOrAdmin } = require('../../middleware/auth')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getStations))
  .post(asyncHandler(postStations))

router.route('/:stationId')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStation))
  .put(requireStationOwnerOrAdmin, asyncHandler(putStation))
  .delete(requireStationOwnerOrAdmin, asyncHandler(deleteStation))

router.route('/:stationId/daily')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationDaily))

router.route('/:stationId/datasets')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getDatasets))
  .post(requireStationOwnerOrAdmin, asyncHandler(postDatasets))

router.route('/:stationId/datasets/:datasetId')
  .all(asyncHandler(attachStation), asyncHandler(attachDataset))
  .get(asyncHandler(getDataset))
  .put(requireStationOwnerOrAdmin, asyncHandler(putDataset))
  .delete(requireStationOwnerOrAdmin, asyncHandler(deleteDataset))

router.route('/:stationId/datasets/:datasetId/process')
  .all(asyncHandler(attachStation), asyncHandler(attachDataset))
  .post(requireStationOwnerOrAdmin, asyncHandler(processDataset))

router.route('/:stationId/datasets/:datasetId/list')
  .all(asyncHandler(attachStation), asyncHandler(attachDataset))
  .get(asyncHandler(listDatasetFiles))

router.route('/:stationId/imagesets')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getImagesets))
  .post(requireStationOwnerOrAdmin, asyncHandler(postImagesets))

router.route('/:stationId/imagesets/:imagesetId')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset))
  .get(asyncHandler(getImageset))
  .put(requireStationOwnerOrAdmin, asyncHandler(putImageset))
  .delete(requireStationOwnerOrAdmin, asyncHandler(deleteImageset))

router.route('/:stationId/imagesets/:imagesetId/process')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset))
  .post(requireStationOwnerOrAdmin, asyncHandler(processImageset))

router.route('/:stationId/imagesets/:imagesetId/images')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset))
  .get(asyncHandler(getImages))
  .post(requireStationOwnerOrAdmin, asyncHandler(postImage))

router.route('/:stationId/imagesets/:imagesetId/images/:imageId')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset), asyncHandler(attachImage))
  .delete(requireStationOwnerOrAdmin, asyncHandler(deleteImage))

router.route('/:stationId/imagesets/:imagesetId/list')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset))
  .get(asyncHandler(listImagesetFiles))

module.exports = router
