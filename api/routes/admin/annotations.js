const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getAdminAnnotationStations
} = require('../../controllers/annotations')

var router = express.Router()

router.route('/stations')
  .get(asyncHandler(getAdminAnnotationStations))

module.exports = router
