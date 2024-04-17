
exports.up = async function (knex) {
  await knex.schema.createTable('model_types', t => {
    t.string('id', 16).primary()
    t.text('name')
  })
  await knex.schema.createTable('models', t => {
    t.increments('id').primary().unsigned()
    t.integer('station_id')
      .references('stations.id')
      .unsigned()
      .index()
      .notNullable()
      .onDelete('CASCADE')
    t.string('model_type_id', 16)
      .references('model_types.id')
      .index()
      .notNullable()
      .onDelete('CASCADE')
    t.string('variable_id', 16)
      .references('variables.id')
      .unsigned()
      .index()
      .onDelete('SET NULL')
    t.text('code').notNullable()
    t.text('uuid')
    t.boolean('default').defaultTo(false)
    t.text('diagnostics_url')
    t.json('diagnostics_s3')
    t.text('predictions_url')
    t.json('predictions_s3')
    t.enu('status', null, {
      useNative: true,
      existingType: true,
      enumName: 'status_type'
    })
    t.timestamps(true, true)
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTable('models')
  await knex.schema.dropTable('model_types')
}
