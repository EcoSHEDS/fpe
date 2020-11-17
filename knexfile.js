require('dotenv-flow').config({
  path: process.cwd().endsWith('/api') ? '../' : process.cwd()
})

const config = {
  client: 'postgresql',
  connection: {
    host: process.env.FPE_DB_HOST,
    port: process.env.FPE_DB_PORT,
    database: process.env.FPE_DB_DATABASE,
    user: process.env.FPE_DB_USER,
    password: process.env.FPE_DB_PASSWORD
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: `${__dirname}/api/db/migrations`
  }
}

module.exports = {
  development: {
    ...config,
    seeds: {
      directory: `${__dirname}/api/db/seeds/development`
    }
  },
  staging: {
    ...config,
    seeds: {
      directory: `${__dirname}/api/db/seeds/staging`
    }
  },
  production: {
    ...config,
    seeds: {
      directory: `${__dirname}/api/db/seeds/production`
    }
  }
}
