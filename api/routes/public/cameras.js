var express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getCameras,

  attachCamera,
  getCamera
} = require('../../controllers/cameras')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getCameras))

router.route('/:cameraId')
  .all(asyncHandler(attachCamera))
  .get(asyncHandler(getCamera))

module.exports = router
