
exports.up = knex => knex.schema.createTable('variables', t => {
  t.string('id', 16).primary()
  t.text('description')
})

exports.down = knex => knex.schema.dropTable('variables')
