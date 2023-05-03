exports.up = async (knex) => {
  await knex.schema.alterTable('imagesets', t => {
    t.enu('pii_status', null, {
      useNative: true,
      existingType: true,
      enumName: 'status_type'
    }).defaultTo('QUEUED').alter()
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('imagesets', t => {
    t.enu('pii_status', null, {
      useNative: true,
      existingType: true,
      enumName: 'status_type'
    }).defaultTo('CREATED').alter()
  })
}
