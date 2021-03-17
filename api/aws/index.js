const AWS = require('aws-sdk')

exports.s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.FPE_REGION
})

const lambda = new AWS.Lambda({
  apiVersion: '2015-03-31',
  region: process.env.FPE_REGION
})

exports.invokeWorker = (payload) => {
  const params = {
    FunctionName: 'fpe-lambda-worker',
    InvocationType: 'Event',
    Payload: Buffer.from(JSON.stringify(payload))
  }
  return lambda.invoke(params).promise()
}

exports.batch = new AWS.Batch({
  apiVersion: '2016-08-10',
  region: process.env.FPE_REGION
})

exports.secretsmanager = new AWS.SecretsManager({
  region: process.env.FPE_REGION
})

exports.createPresignedPostPromise = (params) => {
  return new Promise((resolve, reject) => {
    exports.s3.createPresignedPost(params, (err, data) => {
      if (err) return reject(err)
      return resolve(data)
    })
  })
}
