const express = require('express')
const router = express.Router()

router.get('/', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the Public FPE API' })
})

router.use('/stations', require('./stations'))
router.use('/cameras', require('./cameras'))
router.use('/datasets', require('./datasets'))

module.exports = router
