
exports.up = async (knex) => {
  await knex.schema.table('annotations', t => {
    t.integer('n_daytime')
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('annotations', t => {
    t.dropColumn('n_daytime')
  })
}
