
exports.up = knex => knex.schema.createTable('users', t => {
  t.increments('id').primary().unsigned()
  t.text('email').unique().index()
  t.text('fullname')
  t.text('password')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('users')
