
exports.up = knex => knex.schema.table('stations', t => {
  t.boolean('private').default(false)
})

exports.down = knex => knex.schema.alterTable('stations', t => {
  t.dropColumn('private')
})
