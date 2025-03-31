const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const { Station, Imageset } = require('../db/models')
const { printTable } = require('./lib/utils')
const { NotFoundError } = require('./lib/errors')

const { s3, batch } = require('./lib/aws')

exports.listImagesets = async function (options) {
  let query = Imageset.query().orderBy('id')
  if (options.station) {
    query = query.where({ station_id: options.station })
  }
  const rows = await query

  if (rows.length === 0) {
    console.log('No imagesets found')
  } else {
    printTable(rows, ['id', 'station_id', 'uuid', 'n_images', 'status'])
  }
}

function listFolder (folder) {
  const files = fs.readdirSync(folder).map(f => path.resolve(folder, f))
  return files
}

function uploadImage (file, { dryRun, uuid }) {
  if (dryRun) return Promise.resolve({ Location: `http://example.org/${path.basename(file)}` })
  const stream = fs.createReadStream(file)
  return s3.upload({
    Bucket: process.env.BUCKET,
    Key: `images/${uuid}/${path.basename(file)}`,
    Body: stream
  }).promise()
    .then(result => ({
      filename: path.basename(file),
      url: result.Location,
      s3: {
        Bucket: result.Bucket,
        Key: result.Key
      },
      metadata: {}
      // status: 'CREATED'
    }))
}

async function uploadImages (files, options) {
  const images = []
  for (let i = 0; i < files.length; i++) {
    console.log(`processing image ${path.basename(files[i])} (${i + 1}/${files.length})`)
    const image = await uploadImage(files[i], options)
    images.push(image)
  }
  return images
}

exports.createImageset = async function (folder, options) {
  // generate uuid
  const uuid = uuidv4()

  // create config
  const config = {}

  // get station
  const station = await Station.query().findById(options.station)
  if (!station) {
    throw new NotFoundError(`Station (id=${options.station}) does not exist`)
  }

  // list files
  const files = await listFolder(folder)
  console.log(`files listed (n=${files.length.toLocaleString()})`)

  // validate config
  // validateConfig(parsed, config)
  // console.log('configuration validated')

  // transform
  const images = await uploadImages(files, { dryRun: options.dryRun, uuid })
  console.log(`images processed (n images=${images.length.toLocaleString()})`)

  // create imageset object
  const props = {
    uuid,
    config,
    status: 'CREATED',
    images
  }

  // save to database
  if (options.dryRun) {
    console.log('created imageset:')
    console.log(JSON.stringify(props, null, 2))
  } else {
    const row = await station.$relatedQuery('imagesets')
      .insertGraph(props)
      .returning('*')
    printTable([row], ['id', 'station_id', 'uuid', 'n_images'])
  }
}

exports.processImageset = async function (id) {
  const imageset = await Imageset.query().findById(id)
  if (!imageset) {
    console.error(`Error: Imageset not found (id=${id})`)
    process.exit(1)
  }

  const results = await batch.submitJob({
    jobName: `process-imageset-${id}`,
    jobDefinition: process.env.JOB_DEFINITION_PROCESSOR,
    jobQueue: process.env.JOB_QUEUE,
    containerOverrides: {
      command: [
        'node',
        'process.js',
        'imageset',
        '-i',
        id
      ]
    }
  }).promise()
  console.log(`batch job submitted (jobId: ${results.jobId})`)
}

exports.piiImageset = async function (id) {
  const imageset = await Imageset.query().findById(id)
  if (!imageset) {
    console.error(`Error: Imageset not found (id=${id})`)
    process.exit(1)
  }

  const results = await batch.submitJob({
    jobName: `pii-imageset-${id}`,
    jobDefinition: process.env.JOB_DEFINITION_PII,
    jobQueue: process.env.JOB_QUEUE,
    containerOverrides: {
      command: [
        'detect-fpe-imageset',
        '--workers', '7',
        '--batch-size', '100',
        imageset.id.toString()
      ]
    }
  }).promise()
  console.log(`batch job submitted (jobId: ${results.jobId})`)
}

function deleteImageFromS3 ({ Bucket, Key }) {
  return s3.deleteObject({
    Bucket,
    Key
  }).promise()
}

exports.deleteImageset = async function (id) {
  const imageset = await Imageset.query().findById(id)
    .withGraphFetched('images')
  if (!imageset) {
    console.error(`Error: Imageset not found (id=${id})`)
    process.exit(1)
  }

  console.log('deleting images from s3')
  for (let i = 0; i < imageset.images.length; i++) {
    console.log(`deleting image ${i + 1}/${imageset.images.length}`)
    await deleteImageFromS3(imageset.images[i].full_s3)
    await deleteImageFromS3(imageset.images[i].thumb_s3)
  }

  const nrow = await Imageset.query().deleteById(id)
  if (nrow === 0) {
    console.error(`Error: Failed to delete imageset (id=${id})`)
    process.exit(1)
  }

  console.log(`imageset (id=${id}) deleted successfully`)
}
