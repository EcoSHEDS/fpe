exports.up = knex => knex.schema.alterTable('users', t => {
  t.dropColumn('annotator')
})

exports.down = knex => knex.schema.table('users', t => {
  t.boolean('annotator').default(false)
})
