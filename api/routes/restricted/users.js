const express = require('express')
const asyncHandler = require('express-async-handler')

const router = express.Router()

const {
  attachUser,
  getUser,
  // postUser,
  // putUser,
  // deleteUser,
  getStationsForUser
} = require('../../controllers/users')

router.route('/:userId')
  .all(attachUser)
  .get(asyncHandler(getUser))
  // .post(asyncHandler(postUser))
  // .put(asyncHandler(putUser))
  // .delete(asyncHandler(deleteUser))

router.route('/:userId/stations')
  .all(attachUser)
  .get(asyncHandler(getStationsForUser))

module.exports = router
