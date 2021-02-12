const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getDatasets
} = require('../controllers/datasets')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getDatasets))

module.exports = router
