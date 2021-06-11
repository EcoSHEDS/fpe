const express = require('express')

const router = express.Router()

router.get('/hello', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the public API' })
})

module.exports = router
