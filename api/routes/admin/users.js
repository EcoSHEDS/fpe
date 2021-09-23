const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachAdminUser,
  postUsers,
  getUsers,
  getUser,
  putUser,
  deleteUser
} = require('../../controllers/admin/users')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getUsers))
  .post(asyncHandler(postUsers))

router.route('/:userId')
  .all(asyncHandler(attachAdminUser))
  .get(asyncHandler(getUser))
  .put(asyncHandler(putUser))
  .delete(asyncHandler(deleteUser))

module.exports = router
