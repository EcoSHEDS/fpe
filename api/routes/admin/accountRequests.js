const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getAccountRequests
} = require('../../controllers/admin/accountRequests')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getAccountRequests))

module.exports = router
