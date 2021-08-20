const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  postAccounts
} = require('../../controllers/accounts')

var router = express.Router()

router.route('/')
  .post(asyncHandler(postAccounts))

module.exports = router
