const AWS = require('aws-sdk')

const sns = new AWS.SNS({
  apiVersion: '2010-03-31',
  region: process.env.REGION
})

function createMessage (event) {
  return `New user has registered for an account

Name: ${event.request.userAttributes.name}
Email: ${event.request.userAttributes.email}
User ID: ${event.userName}`
}

exports.handler = async (event) => {
  console.log(`trigger(triggerSource=${event.triggerSource || 'unknown'})`)

  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
    // ignore PostConfirmation_ConfirmForgotPassword events
    return event
  }

  const params = {
    TopicArn: process.env.NOTIFY_TOPIC,
    Subject: '[FPE] New User Registration',
    Message: createMessage(event)
  }

  try {
    await sns.publish(params).promise()
    console.log('notification published')
  } catch (err) {
    console.log('failed to publish notification')
    console.log(err)
  }
  return event
}
