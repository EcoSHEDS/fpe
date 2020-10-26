
exports.up = function (knex) {
  return knex.schema.table('datasets', function (t) {
    t.text('uuid')
  })
}

exports.down = function (knex) {
  return knex.schema.table('datasets', function (t) {
    t.dropColumn('uuid')
  })
}
