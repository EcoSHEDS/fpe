const path = require('path')
require('dotenv-flow').config({
  path: path.resolve(__dirname)
})

const config = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: `${__dirname}/db/migrations`
  }
}

module.exports = {
  development: {
    ...config,
    seeds: {
      directory: `${__dirname}/db/seeds/development`
    }
  },
  staging: {
    ...config,
    seeds: {
      directory: `${__dirname}/db/seeds/staging`
    }
  },
  production: {
    ...config,
    seeds: {
      directory: `${__dirname}/db/seeds/production`
    }
  }
}
