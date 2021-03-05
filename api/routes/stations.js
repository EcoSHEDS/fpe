const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachStation,
  getStations,
  getStation,
  postStations,
  putStation,
  deleteStation
} = require('../controllers/stations')
const {
  attachDataset,
  getDatasets,
  getDataset,
  postDatasets,
  putDataset,
  deleteDataset,
  processDataset
} = require('../controllers/datasets')
const {
  attachImageset,
  getImagesets,
  getImageset,
  postImagesets,
  putImageset,
  deleteImageset,
  processImageset
} = require('../controllers/imagesets')
const {
  getImages,
  postImage
} = require('../controllers/images')
const { isOwner } = require('../middleware/auth')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getStations))
  .post(asyncHandler(postStations))

router.route('/:stationId')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStation))
  .put(isOwner, asyncHandler(putStation))
  .delete(isOwner, asyncHandler(deleteStation))

router.route('/:stationId/datasets')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getDatasets))
  .post(isOwner, asyncHandler(postDatasets))

router.route('/:stationId/datasets/:datasetId')
  .all(asyncHandler(attachStation), asyncHandler(attachDataset))
  .get(asyncHandler(getDataset))
  .put(isOwner, asyncHandler(putDataset))
  .delete(isOwner, asyncHandler(deleteDataset))

router.route('/:stationId/datasets/:datasetId/process')
  .all(asyncHandler(attachStation), asyncHandler(attachDataset))
  .post(isOwner, asyncHandler(processDataset))

router.route('/:stationId/imagesets')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getImagesets))
  .post(isOwner, asyncHandler(postImagesets))

router.route('/:stationId/imagesets/:imagesetId')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset))
  .get(asyncHandler(getImageset))
  .put(isOwner, asyncHandler(putImageset))
  .delete(isOwner, asyncHandler(deleteImageset))

router.route('/:stationId/imagesets/:imagesetId/process')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset))
  .post(isOwner, asyncHandler(processImageset))

router.route('/:stationId/imagesets/:imagesetId/images')
  .all(asyncHandler(attachStation), asyncHandler(attachImageset))
  .get(asyncHandler(getImages))
  .post(isOwner, asyncHandler(postImage))

module.exports = router
