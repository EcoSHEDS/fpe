
exports.up = knex => knex.schema.createTable('stations_permissions', t => {
  t.increments('id').primary().unsigned()
  t.integer('station_id')
    .references('stations.id')
    .index()
    .notNullable()
    .onDelete('CASCADE')
  t.text('user_id')
    .references('users.id')
    .notNullable()
    .onDelete('CASCADE')
})

exports.down = knex => knex.schema.dropTable('stations_permissions')
