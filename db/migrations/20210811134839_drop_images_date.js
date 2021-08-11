
exports.up = knex => knex.schema.alterTable('images', t => {
  t.dropColumn('date')
})

exports.down = knex => knex.schema.table('images', t => {
  t.date('date').default(false)
})
