
exports.up = async (knex) => {
  await knex.schema.table('images', t => {
    t.json('pii_detections')
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('images', t => {
    t.dropColumn('pii_detections')
  })
}
