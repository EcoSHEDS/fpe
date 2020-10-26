const AWS = require('aws-sdk')
const ExifParser = require('exif-parser')
const sharp = require('sharp')

const { Imageset } = require('./db/models')

const s3 = new AWS.S3()

// https://docs.aws.amazon.com/lambda/latest/dg/with-s3-example.html

async function handleImage (image) {
  console.log(`processing image (id=${image.id})`)

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

  // create thumbnail
  const thumbKey = image.s3.Key.replace('/images/', '/thumbs/')
  console.log(`thumbKey: ${thumbKey}`)
  const thumbBuffer = await sharp(s3ImageFile.Body).resize(200).toBuffer()
  await s3.putObject({
    Bucket: image.s3.Bucket,
    Key: thumbKey,
    Body: thumbBuffer,
    ContentType: 'image'
  }).promise()

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
    timestamp,
    metadata
  }

  image = await image.$query().patch(payload).returning('*')
  return image
}

exports.handler = async function (event, context, callback) {
  // console.log('env: ', JSON.stringify(process.env, null, 2))
  console.log('event: ', JSON.stringify(event, 2, null))

  console.log(`fetching imageset record (id=${event.id})`)
  let imageset = await Imageset.query().patch({ status: 'PROCESSING' }).findById(event.id).returning('*')
  if (!imageset) throw new Error(`Imageset record (id=${event.id}) not found`)

  const images = await imageset.$relatedQuery('images').orderBy('id')
  if (images.length === 0) {
    console.log('no images to process')
    return imageset
  }
  console.log(`processing ${images.length} images`)
  for (let i = 0; i < images.length; i++) {
    await handleImage(images[i])
  }
  // update record
  console.log(`updating imageset record (id=${imageset.id})`)
  const payload = {
    status: 'DONE'
  }

  imageset = await imageset.$query().patch(payload).returning('*')

  return imageset
}
