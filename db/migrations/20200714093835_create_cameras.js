
exports.up = knex => knex.schema.createTable('cameras', t => {
  t.increments('id').primary().unsigned()
  t.integer('user_id').references('users.id').unsigned().index().onDelete('CASCADE')
  t.text('name')
  t.text('make')
  t.text('serial')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('cameras')
