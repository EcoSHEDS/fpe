
exports.up = async (knex) => {
  await knex.raw(`
    ALTER TYPE status_type ADD VALUE IF NOT EXISTS 'IN_PROGRESS'
  `)
}

exports.down = async (knex) => {
  // Cannot remove enum values in PostgreSQL without recreating the type
  // This would require recreating all dependent columns
  // Leave as no-op or document manual intervention if needed
}
