const AWS = require('aws-sdk')
const ExifParser = require('exif-parser')
const sharp = require('sharp')
const Joi = require('joi')

const { DateTime } = require('../lib/time')
const { notify, batch } = require('../aws')

const { Imageset } = require('../models')

const s3 = new AWS.S3()

const THUMB_WIDTH = 400

async function notifyMessage (id) {
  const imageset = await Imageset.query()
    .modify('imageSummary')
    .withGraphFetched('[station.user]')
    .findById(id)

  if (!imageset) return null

  return `New photoset has been uploaded to FPE

Imageset ID: ${imageset.id}
Uploaded at: ${DateTime.fromISO(imageset.created_at).tz('US/Eastern').toFormat('DD ttt')}
Status: ${imageset.status}

User ID: ${imageset.station.user.id}
Affiliation: ${imageset.station.user.affiliation_code}
Station: ${imageset.station.name}
Station URL: https://www.usgs.gov/apps/ecosheds/fpe/#/explorer/${imageset.station.id}/

# Images: ${imageset.n_images}
Period: ${DateTime.fromISO(imageset.start_timestamp).setZone(imageset.station.timezone).toFormat('DD')} to ${DateTime.fromISO(imageset.end_timestamp).setZone(imageset.station.timezone).toFormat('DD')}
`
}

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
  let sharpImage = await sharp(s3ImageFile.Body)
  const metadata = await sharpImage.metadata()

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
  if (!exif.tags.DateTimeOriginal && !exif.tags.CreateDate) {
    throw new Error(`Image file (${image.filename}) is missing timestamp (DateTimeOriginal or CreateDate) in EXIF data`)
  }

  // check if image needs to be rotated
  if (metadata.orientation && metadata.orientation !== 1) {
    console.log(`rotating image (image_id=${image.id}, orientation=${metadata.orientation})`)
    sharpImage = await sharpImage.rotate()
    const rotatedBuffer = await sharpImage.keepExif().toBuffer()
    const rotatedMetadata = await sharp(rotatedBuffer).metadata()
    // update exif after rotation
    exif.imageSize = {
      width: rotatedMetadata.width,
      height: rotatedMetadata.height
    }
    // save to s3
    if (!dryRun) {
      console.log(`saving rotated image (image_id=${image.id})`)
      await s3.putObject({
        Bucket: image.full_s3.Bucket,
        Key: image.full_s3.Key,
        Body: rotatedBuffer,
        ContentType: 'image'
      }).promise()
    }
  }

  // create thumbnail
  console.log(`generating thumbnail (image_id=${image.id}, width=${THUMB_WIDTH})`)
  const thumbKey = image.full_s3.Key.replace('images/', 'thumbs/')
  const thumbBuffer = await sharp(s3ImageFile.Body).rotate().resize(THUMB_WIDTH).toBuffer()

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
  const exifDatetime = exif.tags.DateTimeOriginal || exif.tags.CreateDate
  const timestamp = DateTime.fromJSDate(new Date(exifDatetime * 1000)).setZone(`UTC${utcOffset}`, { keepLocalTime: true })
  const payload = {
    ...exif.imageSize,
    timestamp: timestamp.toISO(),
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

  console.log(`computing imageset summary (id=${imageset.id})`)
  const imageSummary = await imageset.$query()
    .modify('imageSummary')

  console.log(`updating imageset record (id=${imageset.id})`)
  imageset = await imageset.$query()
    .patch({
      status: 'DONE',
      start_timestamp: imageSummary.start_timestamp,
      end_timestamp: imageSummary.end_timestamp,
      n_images: imageSummary.n_images
    })
    .returning('*')

  console.log(`submitting PII detector job (id=${imageset.id})`)
  const response = await batch.submitJob({
    jobName: `pii-imageset-${imageset.id}`,
    jobDefinition: process.env.JOB_DEFINITION_PII,
    jobQueue: process.env.JOB_QUEUE,
    containerOverrides: {
      command: [
        'python',
        'detect-imageset.py',
        imageset.id.toString()
      ]
    }
  }).promise()
  console.log(`batch job submitted (jobId: ${response.jobId})`)

  console.log(`updating imageset.pii_status (id=${imageset.id})`)
  imageset = await imageset.$query()
    .patch({
      pii_status: 'QUEUED'
    })
    .returning('*')

  return imageset
}

async function rotateImage (image) {
  console.log(`rotating image (image_id=${image.id})`)

  // download full image file
  console.log(`downloading image file (image_id=${image.id}, Key=${image.full_s3.Key})`)
  let s3ImageFile = await s3.getObject(image.full_s3).promise()
  let sharpImage = await sharp(s3ImageFile.Body)
  let metadata = await sharpImage.metadata()
  const orientation = metadata.orientation

  if (orientation && orientation !== 1) {
    console.log(`rotating image (image_id=${image.id}, orientation=${orientation})`)
    sharpImage = await sharpImage.rotate()
    let rotatedBuffer = await sharpImage.keepExif().toBuffer()
    console.log(`saving rotated image (image_id=${image.id})`)
    await s3.putObject({
      Bucket: image.full_s3.Bucket,
      Key: image.full_s3.Key,
      Body: rotatedBuffer,
      ContentType: 'image'
    }).promise()

    // download thumb image file
    console.log(`downloading thumb file (image_id=${image.id}, Key=${image.thumb_s3.Key})`)
    s3ImageFile = await s3.getObject(image.thumb_s3).promise()
    sharpImage = await sharp(s3ImageFile.Body).withMetadata({ orientation })
    metadata = await sharpImage.metadata()

    console.log(`rotating thumb (image_id=${image.id}, orientation=${metadata.orientation})`)
    sharpImage = await sharpImage.rotate()
    rotatedBuffer = await sharpImage.keepExif().toBuffer()
    console.log(`saving rotated thumb (image_id=${image.id}, key=${image.thumb_s3.Key})`)
    await s3.putObject({
      Bucket: image.thumb_s3.Bucket,
      Key: image.thumb_s3.Key,
      Body: rotatedBuffer,
      ContentType: 'image'
    }).promise()
  } else {
    console.log(`rotation not necessary (image_id=${image.id}, orientation=1)`)
  }

  return image
}

async function rotateImageset (id) {
  console.log(`rotating imageset (id=${id})`)

  console.log(`fetching imageset record (id=${id})`)
  const imageset = await Imageset.query()
    .findById(id)
  if (!imageset) throw new Error(`Imageset record (id=${id}) not found`)

  const images = await imageset.$relatedQuery('images').orderBy('id')
  if (images.length === 0) {
    console.log(`no images to rotate (id=${id})`)
    return imageset
  }

  console.log(`rotating images (id=${id}, n=${images.length})`)
  for (let i = 0; i < images.length; i++) {
    await rotateImage(images[i])
  }

  return imageset
}

module.exports = async function (id, { dryRun, rotateOnly }) {
  try {
    if (rotateOnly) {
      await rotateImageset(id)
    } else {
      await processImageset(id, dryRun)
    }
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
  if (process.env.NOTIFY_TOPIC) {
    const message = await notifyMessage(id)
    if (message) {
      await notify('New Photo Upload', message)
    }
  }
}
