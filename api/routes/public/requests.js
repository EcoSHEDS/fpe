const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  postRequests
} = require('../../controllers/requests')

var router = express.Router()

router.route('/')
  .post(asyncHandler(postRequests))

module.exports = router
