const fs = require('fs')

const { Station, Camera, Imageset } = require('../db/models')
const { fw } = require('./lib/utils')
const { NotFoundError } = require('./lib/errors')

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
    rows.forEach(row => console.log(`${fw(row.id, 4)} | ${fw(row.station_id, 10)} | ${fw(row.camera_id, 9)} | ${fw(row.n_images, 8)}`))
  }
}

function listFolder (folder) {
  const files = fs.readdirSync(folder)
  return files
}

function processImages (files) {
  return files.map(f => ({
    filename: f,
    url: `http://example.org/${f}`,
    timestamp: '2020-07-16T12:00Z',
    metadata: {},
    status: 'DONE'
  }))
}

exports.createImageset = async function (folder, options) {
  console.log(`
Creat new imageset
    folder: ${folder}
station id: ${options.station}
 camera id: ${options.camera}
  `)

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
  console.log(`folder listed (n files=${files.length.toLocaleString()})`)

  // validate config
  // validateConfig(parsed, config)
  console.log('configuration validated')

  // transform
  const images = await processImages(files, config)
  console.log(`images generated (n images=${images.length.toLocaleString()})`)

  // create imageset object
  const props = {
    camera_id: camera.id,
    config,
    n_images: images.length,
    status: 'DONE',
    images
  }

  // save to database
  if (options.dryRun) {
    console.log('created imageset:')
    console.log(JSON.stringify(props, null, 2))
  } else {
    const imageset = await station.$relatedQuery('imagesets').insertGraph(props).returning('*')
    console.log(`imageset saved to db (id=${imageset.id})`)
  }
}

exports.deleteImageset = async function (id) {
  console.log(`
Deleting imageset
  id: ${id}
  `)

  const nrow = await Imageset.query().deleteById(id)
  if (nrow === 0) {
    console.error(`Error: Failed to delete imageset (id=${id})`)
    process.exit(1)
  }

  console.log(`imageset (id=${id}) deleted successfully`)
}
