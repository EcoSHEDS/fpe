const express = require('express')

const { attachUser } = require('../middleware/auth')

const router = express.Router()

router.use(attachUser)

router.get('/hello', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the restricted API', user: res.locals.user })
})

router.use('/admin', require('./admin'))

module.exports = router
