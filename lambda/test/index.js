const { Station } = require('./db')

exports.handler = async function (event, context, callback) {
  console.log('event: ', JSON.stringify(event, 2, null))

  console.log(`fetching station record (id=${event.id})`)
  const station = await Station.query().findById(event.id)
  if (!station) throw new Error(`Station record (id=${event.id}) not found`)

  console.log(JSON.stringify(station, null, 2))

  return station
}
