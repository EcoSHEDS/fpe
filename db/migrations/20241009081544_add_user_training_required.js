
exports.up = knex => knex.schema.table('users', t => {
  t.boolean('training_required').default(true)
})

exports.down = knex => knex.schema.alterTable('users', t => {
  t.dropColumn('training_required')
})
