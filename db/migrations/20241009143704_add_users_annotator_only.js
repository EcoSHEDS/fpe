
exports.up = knex => knex.schema.table('users', t => {
  t.boolean('annotator_only').default(false)
})

exports.down = knex => knex.schema.alterTable('users', t => {
  t.dropColumn('annotator_only')
})
