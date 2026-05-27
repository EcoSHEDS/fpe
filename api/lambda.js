const serverlessExpress = require('@codegenie/serverless-express')
const app = require('./app')

const handler = serverlessExpress({ app })

function restoreApiGatewayResourcePrefix (event) {
  const proxy = event && event.pathParameters && event.pathParameters.proxy
  const resource = event && event.resource

  if (typeof proxy !== 'string' || typeof resource !== 'string') {
    return event
  }

  const match = resource.match(/^\/([^/]+)\/\{proxy\+\}$/)
  if (!match) {
    return event
  }

  const prefix = match[1]
  if (proxy === prefix || proxy.startsWith(`${prefix}/`)) {
    return event
  }

  return {
    ...event,
    pathParameters: {
      ...event.pathParameters,
      proxy: `${prefix}/${proxy}`
    }
  }
}

exports.handler = (event, context) => handler(restoreApiGatewayResourcePrefix(event), context)
exports.restoreApiGatewayResourcePrefix = restoreApiGatewayResourcePrefix
