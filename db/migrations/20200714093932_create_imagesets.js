
exports.up = knex => knex.schema.createTable('imagesets', t => {
  t.increments('id').primary().unsigned()
  t.integer('station_id').references('stations.id').unsigned().index().onDelete('CASCADE')
  t.integer('camera_id').references('cameras.id').unsigned().index().onDelete('CASCADE')
  t.json('config')
  t.enu('status', null, { useNative: true, existingType: true, enumName: 'status_type' })
  t.text('error_message')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('imagesets')
