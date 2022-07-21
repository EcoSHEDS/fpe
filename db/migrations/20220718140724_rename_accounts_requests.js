
exports.up = knex => knex.schema.renameTable('accounts', 'requests')

exports.down = knex => knex.schema.renameTable('requests', 'accounts')
