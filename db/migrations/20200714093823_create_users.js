
exports.up = knex => knex.schema.createTable('users', t => {
  t.text('id').primary() // cognito sub
  t.text('affiliation_code').notNullable()
  t.text('affiliation_name').notNullable()
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('users')
