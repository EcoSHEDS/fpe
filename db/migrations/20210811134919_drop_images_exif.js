
exports.up = knex => knex.schema.alterTable('images', t => {
  t.dropColumn('exif')
})

exports.down = knex => knex.schema.table('images', t => {
  t.json('exif').default(false)
})
