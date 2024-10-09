
exports.up = knex => knex.schema.table('annotations', t => {
  t.boolean('training').default(false)
})

exports.down = knex => knex.schema.alterTable('annotations', t => {
  t.dropColumn('training')
})
