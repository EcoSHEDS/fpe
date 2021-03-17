const statusTypes = require('../types/status')

exports.up = knex => knex.schema.createTable('datasets', t => {
  t.increments('id').primary().unsigned()
  t.integer('station_id')
    .references('stations.id')
    .unsigned()
    .index()
    .notNullable()
    .onDelete('CASCADE')

  t.text('uuid')
  t.enu('status', statusTypes, { useNative: true, enumName: 'status_type' })
  t.text('error_message')

  t.text('filename')
  t.json('config')
  t.json('metadata')

  t.text('url')
  t.json('s3')

  t.timestamp('start_timestamp')
  t.timestamp('end_timestamp')
  t.integer('n_rows')

  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('datasets')
  .then(() => knex.raw('DROP TYPE status_type'))
