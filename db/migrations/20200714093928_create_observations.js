
exports.up = knex => knex.schema.createTable('observations', t => {
  t.increments('id').primary().unsigned()
  t.integer('series_id')
    .references('series.id')
    .unsigned()
    .index()
    .notNullable()
    .onDelete('CASCADE')
  t.timestamp('timestamp')
    .notNullable()
  t.float('value')
    .notNullable()
})

exports.down = knex => knex.schema.dropTable('observations')
