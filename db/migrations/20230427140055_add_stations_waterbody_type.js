const waterbodyTypes = require('../types/waterbodyType')

exports.up = async (knex) => {
  await knex.schema.table('stations', t => {
    t.enu('waterbody_type', waterbodyTypes, { useNative: true, enumName: 'waterbody_type' })
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('stations', t => {
    t.dropColumn('waterbody_type')
  })
  await knex.raw('DROP TYPE waterbody_type')
}
