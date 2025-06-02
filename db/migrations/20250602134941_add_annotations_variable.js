
exports.up = knex => knex.schema.table('annotations', t => {
  t.string('variable_id', 16)
    .references('variables.id')
    .index()
    .onDelete('SET NULL')
})

exports.down = knex => knex.schema.alterTable('annotations', t => {
  t.dropColumn('variable_id')
})
