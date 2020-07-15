
exports.up = knex => knex.schema.createTable('observations', t => {
  t.increments('id').primary().unsigned()
  t.integer('dataset_id').references('datasets.id').unsigned().index().onDelete('CASCADE')
  t.string('variable_id', 16).references('variables.id').unsigned().index().onDelete('CASCADE')
  t.timestamp('timestamp')
  t.float('value')
})

exports.down = knex => knex.schema.dropTable('observations')
