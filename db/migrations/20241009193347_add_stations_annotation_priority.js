
exports.up = knex => knex.schema.table('stations', t => {
  t.boolean('annotation_priority').default(false)
})

exports.down = knex => knex.schema.alterTable('stations', t => {
  t.dropColumn('annotation_priority')
})
