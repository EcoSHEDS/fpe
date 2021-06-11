const express = require('express')

const router = express.Router()

router.get('/', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the public FPE API' })
})

router.use('/datasets', require('./datasets'))
router.use('/series', require('./series'))
router.use('/stations', require('./stations'))

module.exports = router
