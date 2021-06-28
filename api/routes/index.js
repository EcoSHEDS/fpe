const express = require('express')
const createError = require('http-errors')

const router = express.Router()

router.get('/', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the FPE API' })
})

router.use('/admin', require('./admin'))
router.use('/public', require('./public'))
router.use('/restricted', require('./restricted'))

router.use('*', (req, res, next) => {
  next(createError(404, `Path not found (${req.originalUrl})`))
})

module.exports = router
