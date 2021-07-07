const { Station } = require('../db/models')
const { printTable } = require('./lib/utils')

exports.listStations = async function (options) {
  let query = Station.query()
    .select('stations.*', 'user.affiliation_code')
    .leftJoinRelated('user').orderBy('stations.id')
  if (options.user) {
    query = query.where({ user_id: options.user })
  }
  const rows = await query

  if (rows.length === 0) {
    console.log('No stations found')
  } else {
    printTable(rows, ['id', 'affiliation_code', 'user_id', 'name', 'description', 'latitude', 'longitude'])
  }
}

exports.createStation = async function (options) {
  const row = await Station.query().insert({
    user_id: options.user,
    name: options.stationName,
    latitude: options.latitude,
    longitude: options.longitude
  }).returning('*')

  printTable([row], ['id', 'user_id', 'name', 'description', 'latitude', 'longitude'])
}

exports.deleteStation = async function (id) {
  const nrow = await Station.query().deleteById(id)
  if (nrow === 0) {
    console.error(`Error: Failed to delete station (id=${id})`)
    process.exit(1)
  }

  console.log(`station (id=${id}) deleted successfully`)
}
