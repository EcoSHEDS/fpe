const express = require('express')
const createError = require('http-errors')

const router = express.Router()

function requireAdmin (req, res, next) {
  if (!res.locals.user || !res.locals.user.isAdmin) {
    return next(createError(401, 'Unauthorized'))
  }
  next()
}

router.use(requireAdmin)

router.get('/hello', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the admin API', user: res.locals.user })
})

router.use('*', (req, res, next) => {
  next(createError(404, `Path not found (${req.originalUrl})`))
})

module.exports = router
