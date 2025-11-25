exports.up = function(knex) {
  return knex.schema.table('imagesets', (table) => {
    table.integer('n_failed').defaultTo(0)
  })
}

exports.down = function(knex) {
  return knex.schema.table('imagesets', (table) => {
    table.dropColumn('n_failed')
  })
}
