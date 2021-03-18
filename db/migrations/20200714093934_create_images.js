
exports.up = knex => knex.schema.createTable('images', t => {
  t.increments('id').primary().unsigned()
  t.integer('imageset_id')
    .references('imagesets.id')
    .unsigned()
    .index()
    .notNullable()
    .onDelete('CASCADE')

  t.text('filename')
  t.date('date')
  t.timestamp('timestamp')
  t.integer('width')
  t.integer('height')
  t.json('exif')

  t.json('full_s3')
  t.text('full_url')

  t.json('thumb_s3')
  t.text('thumb_url')

  t.enu('status', null, {
    useNative: true,
    existingType: true,
    enumName: 'status_type'
  })
  t.text('error_message')

  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('images')
