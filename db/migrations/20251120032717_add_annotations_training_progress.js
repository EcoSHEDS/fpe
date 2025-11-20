
exports.up = knex => knex.schema.table('annotations', t => {
  t.integer('training_total').nullable()
  t.integer('training_completed').nullable()
  t.text('training_dataset_url').nullable()
})

exports.down = knex => knex.schema.table('annotations', t => {
  t.dropColumn('training_total')
  t.dropColumn('training_completed')
  t.dropColumn('training_dataset_url')
})
