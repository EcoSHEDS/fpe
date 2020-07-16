
exports.up = knex => knex.schema.createTable('observations', t => {
  t.increments('id').primary().unsigned()
  t.integer('series_id').references('series.id').unsigned().index().onDelete('CASCADE')
  t.timestamp('timestamp')
  t.float('value')
})

exports.down = knex => knex.schema.dropTable('observations')
