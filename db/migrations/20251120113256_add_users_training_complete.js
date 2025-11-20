
exports.up = knex => knex.schema.table('users', t => {
  t.boolean('training_complete').default(false)
})

exports.down = knex => knex.schema.table('users', t => {
  t.dropColumn('training_complete')
})
