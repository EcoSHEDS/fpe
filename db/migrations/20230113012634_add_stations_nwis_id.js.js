
exports.up = knex => knex.schema.table('stations', t => {
  t.text('nwis_id')
})

exports.down = knex => knex.schema.alterTable('stations', t => {
  t.dropColumn('nwis_id')
})
