const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachAnnotation,
  postAnnotations,
  getAnnotation,
  putAnnotation
} = require('../../controllers/annotations')
const { requireAnnotationOwnerOrAdmin } = require('../../middleware/auth')

var router = express.Router()

router.route('/')
  .post(asyncHandler(postAnnotations))

router.route('/:annotationId')
  .all(asyncHandler(attachAnnotation))
  .get(asyncHandler(getAnnotation))
  .put(requireAnnotationOwnerOrAdmin, asyncHandler(putAnnotation))

module.exports = router
