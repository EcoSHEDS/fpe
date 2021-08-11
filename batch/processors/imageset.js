const AWS = require('aws-sdk')
const ExifParser = require('exif-parser')
const sharp = require('sharp')
const Joi = require('joi')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.tz.setDefault('UTC')

const { Imageset } = require('../models')

const s3 = new AWS.S3()

const THUMB_WIDTH = 400

function validateConfig (config) {
  const schema = Joi.object({
    timestamp: Joi.object({
      utcOffset: Joi.number().required()
    }).required()
  }).required()

  const { error, value } = schema.validate(config)

  if (error) {
    // console.error(error)
    throw new Error(`Invalid config object (${error.toString()})`)
  }

  return value
}

async function processImage (image, utcOffset, timezone, dryRun) {
  console.log(`processing image (image_id=${image.id})`)

  // download file
  console.log(`downloading image file (image_id=${image.id}, Key=${image.full_s3.Key})`)
  const s3ImageFile = await s3.getObject(image.full_s3).promise()

  // extract exif
  console.log(`extracting exif (image_id=${image.id})`)
  const parser = ExifParser.create(s3ImageFile.Body)
  let exif
  try {
    exif = parser.enableSimpleValues(true).parse()
  } catch (err) {
    console.log(err)
    throw new Error(`failed to extract exif data (image_id=${image.id}, filename=${image.filename})`)
  }

  // check exif
  if (!exif.tags || Object.keys(exif.tags).length === 0) {
    throw new Error(`Image file (${image.filename}) does not have EXIF data`)
  }

  // check exif.CreateDate
  if (!exif.tags.CreateDate) {
    throw new Error(`Image file (${image.filename}) is missing timestamp (CreateDate) in EXIF data`)
  }

  // create thumbnail
  console.log(`generating thumbnail (image_id=${image.id}, width=${THUMB_WIDTH})`)
  const thumbKey = image.full_s3.Key.replace('images/', 'thumbs/')
  const thumbBuffer = await sharp(s3ImageFile.Body).resize(THUMB_WIDTH).toBuffer()

  if (!dryRun) {
    console.log(`saving thumbnail (image_id=${image.id})`)
    await s3.putObject({
      Bucket: image.full_s3.Bucket,
      Key: thumbKey,
      Body: thumbBuffer,
      ContentType: 'image'
    }).promise()
  }

  // update record
  console.log(`updating image record (image_id=${image.id})`)
  const rawDate = new Date(exif.tags.CreateDate * 1000)
  const timestamp = dayjs(rawDate).subtract(utcOffset, 'hour')
  const payload = {
    ...exif.imageSize,
    timestamp: timestamp.toISOString(),
    thumb_s3: {
      Bucket: image.full_s3.Bucket,
      Key: thumbKey
    },
    thumb_url: `https://${image.full_s3.Bucket}.s3.amazonaws.com/${thumbKey}`,
    status: 'DONE'
  }

  if (!dryRun) {
    image = await image.$query().patch(payload).returning('*')
  }

  return image
}

async function processImageset (id, dryRun) {
  if (dryRun) console.log('dryRun: on')
  console.log(`processing imageset (id=${id})`)

  console.log(`fetching imageset record (id=${id})`)
  let imageset
  if (dryRun) {
    imageset = await Imageset.query()
      .findById(id)
  } else {
    imageset = await Imageset.query()
      .patch({ status: 'PROCESSING' })
      .findById(id)
      .returning('*')
  }
  if (!imageset) throw new Error(`Imageset record (id=${id}) not found`)

  console.log(`fetching station record (id=${imageset.station_id})`)
  const station = await imageset.$relatedQuery('station')

  console.log(`validating config (id=${id})`)
  const config = imageset.config
  validateConfig(config)
  console.log(`config (id=${id}):`, JSON.stringify(imageset.config))

  const images = await imageset.$relatedQuery('images').orderBy('id')
  if (images.length === 0) {
    console.log(`no images to process (id=${id})`)
    return imageset
  }

  console.log(`processing images (id=${id}, n=${images.length})`)
  for (let i = 0; i < images.length; i++) {
    await processImage(images[i], imageset.config.timestamp.utcOffset, station.timezone, dryRun)
  }

  if (dryRun) {
    console.log(`finished (id=${id})`)
    console.log(images.slice(0, 9))
    return imageset
  }

  console.log(`updating imageset record (id=${imageset.id})`)

  imageset = await imageset.$query()
    .patch({ status: 'DONE' })
    .returning('*')

  return imageset
}

module.exports = async function (id, { dryRun }) {
  try {
    await processImageset(id, dryRun)
  } catch (e) {
    console.log(`failed (id=${id}): ${e.message || e.toString()}`)
    console.error(e)
    await Imageset.query()
      .patch({
        status: 'FAILED',
        error_message: e.toString()
      })
      .findById(id)
  }
}
