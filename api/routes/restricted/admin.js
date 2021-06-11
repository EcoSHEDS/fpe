const express = require('express')

const { requireAdmin } = require('../../middleware/auth')

const router = express.Router()

router.use(requireAdmin)

router.get('/', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the admin FPE API', user: res.locals.user })
})

module.exports = router
