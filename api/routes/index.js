const express = require('express')
const router = express.Router()
const createError = require('http-errors')

router.get('/', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the FPE API' })
})

router.use('/stations', require('./stations'))
router.use('/cameras', require('./cameras'))
router.use('/datasets', require('./datasets'))

router.use('*', (req, res, next) => {
  next(createError(404, `Path not found (${req.originalUrl})`))
})

module.exports = router
