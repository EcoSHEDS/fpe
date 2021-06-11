const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const logger = require('morgan')
const createError = require('http-errors')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

const { isLambda } = require('./utils')

const app = express()

app.use(logger('tiny'))
app.use(bodyParser.json())
app.use(cors())

if (isLambda()) {
  app.use(awsServerlessExpressMiddleware.eventContext())
}

app.use('/', require('./routes'))

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
