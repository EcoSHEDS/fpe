const express = require('express')

const { attachUser } = require('../../middleware/auth')

const router = express.Router()

router.use(attachUser)

router.get('/', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the restricted FPE API', auth: req.auth })
})

router.use('/admin', require('./admin'))
router.use('/annotations', require('./annotations'))
router.use('/stations', require('./stations'))
router.use('/users', require('./users'))

module.exports = router
