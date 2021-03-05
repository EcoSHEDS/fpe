
exports.up = knex => knex.schema.createTable('series', t => {
  t.increments('id').primary().unsigned()
  t.integer('dataset_id')
    .references('datasets.id')
    .unsigned()
    .index()
    .notNullable()
    .onDelete('CASCADE')
  t.string('variable_id', 16)
    .references('variables.id')
    .unsigned()
    .index()
    .notNullable()
    .onDelete('CASCADE')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('series')
