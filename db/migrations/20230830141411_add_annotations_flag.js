
exports.up = knex => knex.schema.table('annotations', t => {
  t.boolean('flag').default(false)
})

exports.down = knex => knex.schema.alterTable('annotations', t => {
  t.dropColumn('flag')
})
