const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getRequests,
  postRequests,
  attachRequest,
  getRequest,
  putRequest,
  deleteRequest
} = require('../../controllers/requests')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getRequests))
  .post(asyncHandler(postRequests))

router.route('/:requestId')
  .all(asyncHandler(attachRequest))
  .get(asyncHandler(getRequest))
  .put(asyncHandler(putRequest))
  .delete(asyncHandler(deleteRequest))

module.exports = router
