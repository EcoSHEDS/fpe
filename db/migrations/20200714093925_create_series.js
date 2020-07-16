
exports.up = knex => knex.schema.createTable('series', t => {
  t.increments('id').primary().unsigned()
  t.integer('dataset_id').references('datasets.id').unsigned().index().onDelete('CASCADE')
  t.string('variable_id', 16).references('variables.id').unsigned().index().onDelete('CASCADE')
  t.timestamp('start_timestamp')
  t.timestamp('end_timestamp')
  t.integer('n_values')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('series')
