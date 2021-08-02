
exports.up = knex => knex.schema.createTable('stations', t => {
  t.increments('id').primary().unsigned()
  t.text('user_id')
    .references('users.id')
    .index()
    .notNullable()
    .onDelete('SET NULL')
  t.text('name').notNullable()
  t.text('description')
  t.float('latitude').notNullable()
  t.float('longitude').notNullable()
  t.text('timezone').notNullable()
  t.json('metadata')
  t.timestamps(true, true)

  t.unique(['user_id', 'name'])
})

exports.down = knex => knex.schema.dropTable('stations')
