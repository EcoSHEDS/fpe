
exports.up = knex => knex.schema.createTable('stations', t => {
  t.increments('id').primary().unsigned()
  t.integer('user_id').references('users.id').unsigned().index().onDelete('CASCADE')
  t.text('name')
  t.float('latitude')
  t.float('longitude')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('stations')
