const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const logger = require('morgan')
const createError = require('http-errors')
// const asyncHandler = require('express-async-handler')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

// const { attachUser } = require('./middleware/auth')
const { isLambda } = require('./utils')

const app = express()

app.use(logger('tiny'))
app.use(bodyParser.json())
app.use(cors())

if (isLambda()) {
  app.use(awsServerlessExpressMiddleware.eventContext())
}

// app.use(asyncHandler(attachUser))

app.use('/public', require('./routes/public'))
app.use('/restricted', require('./routes/restricted'))

app.use('*', (req, res, next) => {
  next(createError(404, `Path not found (${req.originalUrl})`))
})

app.use((err, req, res, next) => {
  const status = err.status || 500
  res.status(status)
  const payload = {
    status,
    message: err.message,
    stack: err.stack
  }
  if (process.env.ENV !== 'dev') {
    delete payload.stack
  }
  res.json(payload)
})

module.exports = app
