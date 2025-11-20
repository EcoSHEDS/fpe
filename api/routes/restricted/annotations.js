const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachAnnotation,
  postAnnotations,
  getAnnotation,
  putAnnotation,
  getAnnotationStations,
  getAnnotationTraining,
  getTrainingResume
} = require('../../controllers/annotations')

const { requireAnnotationOwnerOrAdmin } = require('../../middleware/auth')

var router = express.Router()

router.route('/')
  .post(asyncHandler(postAnnotations))

router.route('/stations')
  .get(asyncHandler(getAnnotationStations))

router.route('/training')
  .get(asyncHandler(getAnnotationTraining))

router.route('/training/resume')
  .get(asyncHandler(getTrainingResume))

router.route('/:annotationId')
  .all(asyncHandler(attachAnnotation))
  .get(asyncHandler(getAnnotation))
  .put(requireAnnotationOwnerOrAdmin, asyncHandler(putAnnotation))

module.exports = router
