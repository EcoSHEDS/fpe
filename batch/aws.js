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
  console.log(`notify: start(TopicArn=${params.TopicArn}, subject="${subject}")`)

  const response = await sns.publish(params).promise()
  console.log(`notify: done(MessageId=${response.MessageId})`)

  return response
}
