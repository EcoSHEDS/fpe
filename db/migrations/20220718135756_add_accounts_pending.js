
exports.up = knex => knex.schema.table('accounts', t => {
  t.boolean('pending').default(true)
})

exports.down = knex => knex.schema.alterTable('accounts', t => {
  t.dropColumn('pending')
})
