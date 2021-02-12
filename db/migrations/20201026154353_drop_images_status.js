
exports.up = function (knex) {
  return knex.schema.table('images', function (t) {
    t.dropColumn('status')
  })
}

exports.down = function (knex) {
  return knex.schema.table('images', function (t) {
    t.enu('status', null, { useNative: true, existingType: true, enumName: 'status_type' })
  })
}
