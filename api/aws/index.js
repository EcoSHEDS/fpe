const AWS = require('aws-sdk')

const sns = new AWS.SNS({
  apiVersion: '2010-03-31',
  region: process.env.REGION
})

exports.notify = async (subject, message) => {
  const params = {
    TopicArn: process.env.NOTIFY_TOPIC,
    Subject: `[FPE] ${subject}`,
    Message: message
  }

  return await sns.publish(params).promise()
}

exports.s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.REGION
})

const lambda = new AWS.Lambda({
  apiVersion: '2015-03-31',
  region: process.env.REGION
})

exports.invokeWorker = (payload) => {
  const params = {
    FunctionName: process.env.LAMBDA_WORKER,
    InvocationType: 'Event',
    Payload: Buffer.from(JSON.stringify(payload))
  }
  return lambda.invoke(params).promise()
}

exports.batch = new AWS.Batch({
  apiVersion: '2016-08-10',
  region: process.env.REGION
})

exports.secretsmanager = new AWS.SecretsManager({
  region: process.env.REGION
})

exports.createPresignedPostPromise = (params) => {
  return new Promise((resolve, reject) => {
    exports.s3.createPresignedPost(params, (err, data) => {
      if (err) return reject(err)
      return resolve(data)
    })
  })
}
