const stationStatus = require('../types/stationStatus')

exports.up = async (knex) => {
  await knex.schema.table('stations', t => {
    t.enu('status', stationStatus, { useNative: true, enumName: 'station_status' })
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('stations', t => {
    t.dropColumn('status')
  })
  await knex.raw('DROP TYPE station_status')
}
