const express = require('express')

const { attachUser } = require('../../middleware/auth')

const router = express.Router()

router.use(attachUser)

router.get('/', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the restricted FPE API', user: res.locals.user })
})

router.use('/admin', require('./admin'))
router.use('/stations', require('./stations'))
router.use('/users', require('./users'))

module.exports = router
