exports.up = knex => knex.schema.table('stations', t => {
  t.text('nims_camera_id')
})

exports.down = knex => knex.schema.alterTable('stations', t => {
  t.dropColumn('nims_camera_id')
})
