const statusTypes = require('../types/status')

exports.up = knex => knex.schema.createTable('datasets', t => {
  t.increments('id').primary().unsigned()
  t.integer('station_id').references('stations.id').unsigned().index().onDelete('CASCADE')
  t.text('url')
  t.text('filename')
  t.json('config')
  t.enu('status', statusTypes, { useNative: true, enumName: 'status_type' })
  t.text('error_message')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('datasets')
  .then(() => knex.raw('DROP TYPE status_type'))
