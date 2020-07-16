const AWS = require('aws-sdk')

exports.s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'us-east-1'
})
