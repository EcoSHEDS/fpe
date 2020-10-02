const AWS = require('aws-sdk')

const S3_BUCKET = process.env.S3_BUCKET
console.log(`s3 bucket: ${S3_BUCKET}`)

const s3 = new AWS.S3()

exports.handler = function (event, context, callback) {
  console.log('event')
  console.log(event)
  console.log('context')
  console.log(context)
  const params = {
    Body: 'hello world',
    Bucket: S3_BUCKET,
    Key: 'hello-world'
  }
  console.log('putObject')
  s3.putObject(params, (err, data) => {
    if (err) return console.log(err, err.stack)
    console.log(data)
    console.log('getObject')
    s3.getObject({
      Bucket: S3_BUCKET,
      Key: 'hello-world'
    }, (err, data) => {
      if (err) return console.log(err, err.stack)
      console.log(data)
      // console.log('deleteObject')
      // s3.deleteObject({
      //   Bucket: S3_BUCKET,
      //   Key: 'hello-world'
      // }, (err, data) => {
      //   if (err) return console.log(err, err.stack)
      //   console.log(data)
      callback(null, 'done')
      // })
    })
  })
}
