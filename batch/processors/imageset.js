const AWS = require('aws-sdk')
const ExifParser = require('exif-parser')
const sharp = require('sharp')

const { Imageset } = require('../models')

const s3 = new AWS.S3()

async function handleImage (image) {
  console.log(`processing image (id=${image.id})`)

  // download file
  console.log(`downloading image file (id=${image.id}, Key=${image.full_s3.Key})`)
  const s3ImageFile = await s3.getObject(image.full_s3).promise()

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
  const thumbKey = image.full_s3.Key.replace('images/', 'thumbs/')
  console.log(`thumbKey: ${thumbKey}`)
  const thumbBuffer = await sharp(s3ImageFile.Body).resize(200).toBuffer()
  await s3.putObject({
    Bucket: image.full_s3.Bucket,
    Key: thumbKey,
    Body: thumbBuffer,
    ContentType: 'image'
  }).promise()

  // update record
  console.log(`updating image record (id=${image.id})`)
  // console.log('exif')
  // console.log(result)
  const timestamp = (new Date(result.tags.CreateDate * 1000)).toISOString()

  const payload = {
    ...result.imageSize,
    exif: result.tags,
    timestamp,
    thumb_s3: {
      Bucket: image.full_s3.Bucket,
      Key: thumbKey
    },
    thumb_url: `https://${image.full_s3.Bucket}.s3.amazonaws.com/${thumbKey}`,
    status: 'DONE'
  }

  image = await image.$query().patch(payload).returning('*')
  return image
}

async function processImageset (id) {
  console.log(`processing imageset (id=${id})`)

  console.log(`fetching imageset record (id=${id})`)
  let imageset = await Imageset.query().patch({ status: 'PROCESSING' })
    .findById(id).returning('*')
  if (!imageset) throw new Error(`Imageset record (id=${id}) not found`)

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

module.exports = async function (id) {
  try {
    await processImageset(id)
  } catch (e) {
    console.log('failed')
    console.error(e)
    await Imageset.query()
      .patch({
        status: 'FAILED',
        error_message: e.toString()
      })
      .findById(id)
  }
}
