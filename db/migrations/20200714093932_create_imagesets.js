
exports.up = knex => knex.schema.createTable('imagesets', t => {
  t.increments('id').primary().unsigned()
  t.integer('station_id')
    .references('stations.id')
    .unsigned()
    .index()
    .notNullable()
    .onDelete('CASCADE')

  t.text('uuid')
  t.enu('status', null, {
    useNative: true,
    existingType: true,
    enumName: 'status_type'
  })
  t.text('error_message')

  t.json('config')
  t.json('metadata')

  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('imagesets')
