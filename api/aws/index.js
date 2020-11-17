const AWS = require('aws-sdk')

exports.s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.FPE_REGION
})

exports.lambda = new AWS.Lambda({
  apiVersion: '2015-03-31',
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
