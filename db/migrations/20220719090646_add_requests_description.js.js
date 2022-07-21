
exports.up = knex => knex.schema.table('requests', t => {
  t.text('description')
})

exports.down = knex => knex.schema.alterTable('requests', t => {
  t.dropColumn('description')
})
