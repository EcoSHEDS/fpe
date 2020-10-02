var express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getCameras,
  postCameras,

  attachCamera,
  getCamera,
  putCamera,
  deleteCamera,

  isOwner
} = require('../controllers/cameras')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getCameras))
  .post(asyncHandler(postCameras))

router.route('/:cameraId')
  .all(asyncHandler(attachCamera))
  .get(asyncHandler(getCamera))
  .put(isOwner, asyncHandler(putCamera))
  .delete(isOwner, asyncHandler(deleteCamera))

module.exports = router
