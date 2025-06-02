
exports.up = knex => knex.schema.table('annotations', t => {
  t.text('variable').notNullable()
})

exports.down = knex => knex.schema.alterTable('annotations', t => {
  t.dropColumn('variable')
})
