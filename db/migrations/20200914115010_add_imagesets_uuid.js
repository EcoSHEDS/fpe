
exports.up = function (knex) {
  return knex.schema.table('imagesets', function (t) {
    t.text('uuid')
  })
}

exports.down = function (knex) {
  return knex.schema.table('imagesets', function (t) {
    t.dropColumn('uuid')
  })
}
