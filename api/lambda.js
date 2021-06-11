const awsServerlessExpress = require('aws-serverless-express')
const app = require('./app')

const server = awsServerlessExpress.createServer(app)

exports.handler = (event, context) => {
  if (process.env.ENV === 'dev') {
    console.log(`event: ${JSON.stringify(event)}`)
  }
  awsServerlessExpress.proxy(server, event, context)
}
