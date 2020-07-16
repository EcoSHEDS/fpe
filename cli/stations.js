const { User, Station } = require('../db/models')
const { fw } = require('./lib/utils')
const { NotFoundError } = require('./lib/errors')

exports.listStations = async function (options) {
  console.log(`
List new stations
  user id: ${options.user || '<ANY>'}
  `)
  let query = Station.query().orderBy('id')
  if (options.user) {
    query = query.where({ user_id: options.user })
  }
  const rows = await query

  if (rows.length === 0) {
    console.log('No stations found')
  } else {
    console.log(' user_id |   id |                     name |   latitude |  longitude')
    console.log('---------|------|--------------------------|------------|-----------')
    rows.forEach(row => console.log(`${fw(row.user_id, 8)} | ${fw(row.id, 4)} | ${fw(row.name, 24)} | ${fw(row.latitude.toFixed(5), 10)} | ${fw(row.longitude.toFixed(5), 10)}`))
  }
}

exports.createStation = async function (options) {
  console.log(`
Create new station
  user id: ${options.user}
     name: ${options.stationName}
 latitude: ${options.latitude}
longitude: ${options.longitude}
  `)

  const user = await User.query().findById(options.user)

  if (!user) {
    throw new NotFoundError(`User (id=${options.user}) does not exist`)
  }

  const row = await Station.query().insert({
    user_id: options.user,
    name: options.stationName,
    latitude: options.latitude,
    longitude: options.longitude
  }).returning('*')

  console.log(`Station (id=${row.id}) saved to database`)
}

exports.deleteStation = async function (id) {
  console.log(`
Deleting station
  id: ${id}
  `)

  const nrow = await Station.query().deleteById(id)
  if (nrow === 0) {
    console.error(`Error: Failed to delete station (id=${id})`)
    process.exit(1)
  }

  console.log(`station (id=${id}) deleted successfully`)
}
