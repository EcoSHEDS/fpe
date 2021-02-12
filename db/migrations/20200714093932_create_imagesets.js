
exports.up = knex => knex.schema.createTable('imagesets', t => {
  t.increments('id').primary().unsigned()
  t.integer('station_id')
    .references('stations.id')
    .unsigned()
    .index()
    .notNullable()
    .onDelete('CASCADE')
  t.text('uuid')
  t.integer('n_images')
  t.json('meta')
  t.enu('status', null, {
    useNative: true,
    existingType: true,
    enumName: 'status_type'
  })
  t.text('error_message')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('imagesets')
