
exports.up = async (knex) => {
  await knex.schema.table('imagesets', t => {
    t.enu('pii_status', null, {
      useNative: true,
      existingType: true,
      enumName: 'status_type'
    }).defaultTo('CREATED')
  })
  await knex.schema.table('images', t => {
    t.float('pii_animal').defaultTo(0)
    t.float('pii_person').defaultTo(0)
    t.float('pii_vehicle').defaultTo(0)
    t.boolean('pii_user').defaultTo(false)
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('imagesets', t => {
    t.dropColumn('pii_status')
  })
  await knex.schema.alterTable('images', t => {
    t.dropColumn('pii_animal')
    t.dropColumn('pii_person')
    t.dropColumn('pii_vehicle')
    t.dropColumn('pii_user')
  })
}
