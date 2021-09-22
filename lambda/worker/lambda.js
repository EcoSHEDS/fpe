const AWS = require('aws-sdk')

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.REGION
})

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
  region: process.env.REGION
})
const userPoolId = process.env.USERPOOL_ID

const listS3Objects = async (event, token) => {
  console.log(`listS3Objects(prefix='${event.prefix}',token=${!!token})`)
  const response = await s3.listObjectsV2({
    Bucket: process.env.BUCKET || event.bucket,
    Prefix: event.prefix,
    ContinuationToken: token
  }).promise()

  const keys = response.Contents.map(d => d.Key)

  if (response.IsTruncated) {
    return [keys, await listS3Objects(event, response.NextContinuationToken)].flat()
  }

  return {
    statusCode: 200,
    body: keys,
    message: `S3 objects have been listed (n=${keys.length})`
  }
}

const deleteS3Objects = async (event) => {
  console.log(`deleteS3Objects(prefix='${event.prefix}')`)
  const { body: keys } = await listS3Objects(event)

  console.log(`deleteS3Objects(prefix='${event.prefix}'): deleting objects (n=${keys.length})`)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    try {
      // console.log(`deleteS3Objects: deleting object (key=${key})`)
      await s3.deleteObject({
        Bucket: process.env.BUCKET || event.bucket,
        Key: key
      }).promise()
    } catch (err) {
      console.log(`Failed to delete object on s3 (key=${key})`)
      console.error(err)
      return
    }
  }

  return {
    statusCode: 200,
    body: keys,
    message: `S3 objects have been deleted (n=${keys.length})`
  }
}

async function createAdminUser ({ email, name }) {
  const params = {
    UserPoolId: userPoolId,
    Username: email,
    DesiredDeliveryMediums: ['EMAIL'],
    UserAttributes: [
      {
        Name: 'name',
        Value: name
      },
      {
        Name: 'email',
        Value: email
      },
      {
        Name: 'email_verified',
        Value: 'true'
      }
    ]
  }
  try {
    const createUserResponse = await cognitoIdentityServiceProvider.adminCreateUser(params).promise()
    console.log(`user created (id=${createUserResponse.User.Username})`)
    console.log(createUserResponse)
    await cognitoIdentityServiceProvider.adminAddUserToGroup({
      GroupName: 'admins',
      UserPoolId: userPoolId,
      Username: createUserResponse.User.Username
    }).promise()
    console.log(`user (id=${createUserResponse.User.Username}) added to admins`)
  } catch (err) {
    console.log('failed to create admin user')
    console.log(err)
  }
}

const processEvent = async (event) => {
  console.log(`processing event (${event.method})`)
  switch (event.method) {
    case 'deleteS3Objects':
      return await deleteS3Objects(event)
    case 'listS3Objects':
      return await listS3Objects(event)
    case 'createAdminUser':
      return await createAdminUser(event)
    default:
      throw new Error(`Missing or unsupported event method ("${event.method}")`)
  }
}

exports.handler = async (event) => {
  try {
    return await processEvent(event)
  } catch (err) {
    console.log(err)
    return {
      statusCode: 500,
      body: JSON.stringify('Failed to process event'),
      error: err.message || err.toString()
    }
  }
}
