const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getVariables
} = require('../../controllers/variables')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getVariables))

module.exports = router