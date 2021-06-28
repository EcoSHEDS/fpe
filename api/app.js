const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const logger = require('morgan')
const createError = require('http-errors')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const jwt = require('jsonwebtoken')

const { isLambda } = require('./utils')

const app = express()

app.use(logger('tiny'))
app.use(bodyParser.json())
app.use(cors())

if (isLambda()) {
  app.use(awsServerlessExpressMiddleware.eventContext())
} else if (process.env.NODE_ENV === 'development') {
  // mock awsServerlessExpressMiddleware
  console.log('mock awsServerlessExpressMiddleware')
  app.use((req, res, next) => {
    if (req.headers.authorization) {
      const decoded = jwt.decode(req.headers.authorization)
      if (decoded['cognito:groups']) {
        decoded['cognito:groups'] = decoded['cognito:groups'].join(',')
      }
      req.apiGateway = {
        event: {
          requestContext: {
            authorizer: {
              claims: decoded
            }
          }
        }
      }
    }
    next()
  })
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
