exports.up = async (knex) => {
  await knex.schema.alterTable('images', t => {
    t.renameColumn('pii_user', 'pii_on')
  })
  await knex.schema.table('images', t => {
    t.boolean('pii_off').defaultTo(false)
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('images', t => {
    t.dropColumn('pii_off')
    t.renameColumn('pii_on', 'pii_user')
  })
}
