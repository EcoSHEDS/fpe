const express = require('express')
const { attachUser, requireAdmin } = require('../../middleware/auth')

const router = express.Router()

router.use(attachUser)
router.use(requireAdmin)

router.get('/', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the admin FPE API' })
})

router.use('/users', require('./users'))

module.exports = router
