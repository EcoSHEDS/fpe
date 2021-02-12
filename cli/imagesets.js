const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const { Station, Camera, Imageset } = require('../api/db/models')
const { fw } = require('./lib/utils')
const { NotFoundError } = require('./lib/errors')

const { s3, batch } = require('../api/aws')

exports.listImagesets = async function (options) {
  console.log(`
List imagesets
  station id: ${options.station || '<ANY>'}
  `)

  let query = Imageset.query().orderBy('id')
  if (options.station) {
    query = query.where({ station_id: options.station })
  }
  const rows = await query

  if (rows.length === 0) {
    console.log('No imagesets found')
  } else {
    console.log('  id | station_id | camera_id | n_images')
    console.log('-----|------------|-----------|---------')
    rows.forEach(row => console.log(`${fw(row.id, 4)} | ${fw(row.station_id, 10)} | ${fw(row.camera_id, 9)} | ${fw(row.n_images || 0, 8)}`))
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
    Bucket: process.env.FPE_S3_BUCKET,
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
  console.log(`
Create imageset
    folder: ${folder}
station id: ${options.station}
 camera id: ${options.camera}
  `)

  // generate uuid
  const uuid = uuidv4()

  // create config
  const config = {}

  // get station
  const station = await Station.query().findById(options.station)
  if (!station) {
    throw new NotFoundError(`Station (id=${options.station}) does not exist`)
  }

  // get camera
  const camera = await Camera.query().findById(options.camera)
  if (!camera) {
    throw new NotFoundError(`Camera (id=${options.camera}) does not exist`)
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
    camera_id: camera.id,
    uuid,
    config,
    n_images: images.length,
    status: 'CREATED',
    images
  }

  // save to database
  if (options.dryRun) {
    console.log('created imageset:')
    console.log(JSON.stringify(props, null, 2))
  } else {
    const imageset = await station.$relatedQuery('imagesets')
      .insertGraph(props)
      .returning('*')
    console.log(`imageset saved to db (id=${imageset.id})`)
  }
}

exports.processImageset = async function (id) {
  console.log(`
Process imageset
  id: ${id}
  `)

  const imageset = await Imageset.query().findById(id)
  if (!imageset) {
    console.error(`Error: Imageset not found (id=${id})`)
    process.exit(1)
  }

  const results = await batch.submitJob({
    jobName: 'process-imageset',
    jobDefinition: 'fpe-batch-job-definition',
    jobQueue: 'fpe-batch-job-queue',
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

function deleteImageFromS3 ({ Bucket, Key }) {
  return s3.deleteObject({
    Bucket,
    Key
  }).promise()
}

exports.deleteImageset = async function (id) {
  console.log(`
Delete imageset
  id: ${id}
  `)

  const imageset = await Imageset.query().findById(id)
    .withGraphFetched('images')
  if (!imageset) {
    console.error(`Error: Imageset not found (id=${id})`)
    process.exit(1)
  }

  console.log('deleting images from s3')
  for (let i = 0; i < imageset.images.length; i++) {
    console.log(`deleting image ${i + 1}/${imageset.images.length}`)
    await deleteImageFromS3(imageset.images[i].s3)
  }

  const nrow = await Imageset.query().deleteById(id)
  if (nrow === 0) {
    console.error(`Error: Failed to delete imageset (id=${id})`)
    process.exit(1)
  }

  console.log(`imageset (id=${id}) deleted successfully`)
}
