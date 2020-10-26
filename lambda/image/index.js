const AWS = require('aws-sdk')
const ExifParser = require('exif-parser')
const { Image } = require('./db/models')

const s3 = new AWS.S3()

// https://docs.aws.amazon.com/lambda/latest/dg/with-s3-example.html

exports.handler = async function (event, context, callback) {
  // console.log('env: ', JSON.stringify(process.env, null, 2))
  console.log('event: ', JSON.stringify(event, 2, null))

  console.log(`fetching image record (id=${event.id})`)
  let image = await Image.query().patch({ status: 'PROCESSING' }).findById(event.id).returning('*')
  if (!image) throw new Error(`Image record (id=${event.id}) not found`)

  // download file
  console.log(`downloading image file (id=${image.id}, Key=${image.s3.Key})`)
  const s3ImageFile = await s3.getObject(image.s3).promise()

  // extract exif
  console.log(`extracting exif (id=${image.id})`)
  const parser = ExifParser.create(s3ImageFile.Body)
  let result
  try {
    result = parser.enableSimpleValues(true).parse()
  } catch (err) {
    console.log('failed to extract exif data')
    console.log(err)
  }

  // update record
  console.log(`updating image record (id=${image.id})`)
  const timestamp = (new Date(result.tags.CreateDate * 1000)).toISOString()
  const metadata = {
    make: result.tags.Make,
    model: result.tags.Model,
    width: result.imageSize.width,
    height: result.imageSize.height
  }
  const payload = {
    status: 'DONE',
    timestamp,
    metadata
  }

  image = await image.$query().patch(payload).returning('*')

  return image
}
