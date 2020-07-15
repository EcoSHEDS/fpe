const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')
const asyncHandler = require('express-async-handler')

const { attachUser } = require('./middleware/auth')

const app = express()

app.use(logger('dev'))
app.use(bodyParser.json())

app.use(asyncHandler(attachUser))

app.use('/', require('./routes/index'))

app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  res.status(status)
  const payload = {
    status,
    message: err.message,
    stack: err.stack
  }
  if (process.env.NODE_ENV !== 'development') {
    delete payload.stack
  }
  res.json(payload)
})

module.exports = app
