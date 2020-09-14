const { User, Camera } = require('../db/models')
const { fw } = require('./lib/utils')
const { NotFoundError } = require('./lib/errors')

exports.listCameras = async function (options) {
  console.log(`
List cameras
  user id: ${options.user || '<ANY>'}
  `)
  let query = Camera.query().orderBy('id')
  if (options.user) {
    query = query.where({ user_id: options.user })
  }
  const rows = await query

  if (rows.length === 0) {
    console.log('No cameras found')
  } else {
    console.log(' user_id |   id |         name |         make |       serial')
    console.log('---------|------|--------------|--------------|-------------')
    rows.forEach(row => console.log(`${fw(row.user_id, 8)} | ${fw(row.id, 4)} | ${fw(row.name, 12)} | ${fw(row.make, 12)} | ${fw(row.serial, 12)}`))
  }
}

exports.createCamera = async function (options) {
  console.log(`
Create camera
  user id: ${options.user}
     name: ${options.cameraName}
     make: ${options.make}
   serial: ${options.serial}
  `)

  const user = await User.query().findById(options.user)

  if (!user) {
    throw new NotFoundError(`User (id=${options.user}) does not exist`)
  }

  const row = await Camera.query().insert({
    user_id: options.user,
    name: options.cameraName,
    make: options.make,
    serial: options.serial
  }).returning('*')

  console.log(`Camera (id=${row.id}) saved to database`)
}

exports.deleteCamera = async function (id) {
  console.log(`
Delete camera
  id: ${id}
  `)

  const nrow = await Camera.query().deleteById(id)
  if (nrow === 0) {
    console.error(`Error: Failed to delete camera (id=${id})`)
    process.exit(1)
  }

  console.log(`camera (id=${id}) deleted successfully`)
}
