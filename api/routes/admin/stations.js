const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getAllStations
} = require('../../controllers/stations')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getAllStations))

module.exports = router
