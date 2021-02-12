
exports.up = function (knex) {
  return knex.schema.table('images', function (t) {
    t.json('s3')
  })
}

exports.down = function (knex) {
  return knex.schema.table('images', function (t) {
    t.dropColumn('s3')
  })
}
