
exports.up = knex => knex.schema.createTable('values', t => {
  t.bigIncrements('id').primary().unsigned()
  t.integer('series_id')
    .references('series.id')
    .unsigned()
    .index()
    .notNullable()
    .onDelete('CASCADE')
  t.date('date').notNullable()
  t.timestamp('timestamp').notNullable()
  t.float('value').notNullable()
  t.text('flag')
})

exports.down = knex => knex.schema.dropTable('values')
