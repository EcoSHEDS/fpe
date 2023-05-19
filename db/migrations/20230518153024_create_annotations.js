
exports.up = knex => knex.schema.createTable('annotations', t => {
  t.increments('id').primary().unsigned()
  t.text('user_id')
    .references('users.id')
    .index()
    .notNullable()
    .onDelete('SET NULL')
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
  t.float('duration_sec')
  t.integer('n')
  t.text('url')
  t.json('s3')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('annotations')
