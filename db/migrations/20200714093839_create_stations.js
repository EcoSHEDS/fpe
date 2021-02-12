
exports.up = knex => knex.schema.createTable('stations', t => {
  t.increments('id').primary().unsigned()
  t.integer('user_id')
    .references('users.id')
    .unsigned()
    .index()
    .notNullable()
    .onDelete('CASCADE')
  t.text('name')
    .notNullable()
  t.text('description')
  t.float('latitude')
    .notNullable()
  t.float('longitude')
    .notNullable()
  t.timestamps(true, true)

  t.unique(['user_id', 'name'])
})

exports.down = knex => knex.schema.dropTable('stations')
