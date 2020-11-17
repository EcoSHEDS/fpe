
exports.up = function (knex) {
  return knex.schema.table('images', function (t) {
    t.json('thumb_s3')
    t.text('thumb_url')
  })
}

exports.down = function (knex) {
  return knex.schema.table('images', function (t) {
    t.dropColumn('thumb_s3')
    t.dropColumn('thumb_url')
  })
}
