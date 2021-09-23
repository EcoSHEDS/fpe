
exports.up = knex => knex.schema.createTable('accounts', t => {
  t.increments('id').primary().unsigned()
  t.text('name').notNullable()
  t.text('email').notNullable()
  t.text('affiliation_code').notNullable()
  t.text('affiliation_name').notNullable()
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('accounts')
