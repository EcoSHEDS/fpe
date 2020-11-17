const config = {
  client: 'postgresql',
  connection: {
    host: process.env.FPE_DB_HOST,
    port: process.env.FPE_DB_PORT,
    database: process.env.FPE_DB_DATABASE,
    user: process.env.FPE_DB_USER,
    password: process.env.FPE_DB_PASSWORD
  }
}

module.exports = require('knex')(config)
