
exports.up = knex => knex.schema.createTable('images', t => {
  t.increments('id').primary().unsigned()
  t.integer('imageset_id').references('imagesets.id').unsigned().index().onDelete('CASCADE')
  t.timestamp('timestamp')
  t.text('filename')
  t.text('url')
  t.json('metadata')
})

exports.down = knex => knex.schema.dropTable('images')
