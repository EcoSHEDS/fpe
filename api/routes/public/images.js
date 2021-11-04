const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachImage,
  getImage
} = require('../../controllers/images')

var router = express.Router()

router.route('/:imageId')
  .all(asyncHandler(attachImage))
  .get(asyncHandler(getImage))

module.exports = router
