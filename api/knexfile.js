const { secretsmanager } = require('./aws')

// override date parser to prevent fields of type `date` from being converted to JS Date()
// https://github.com/brianc/node-postgres/issues/1844
const types = require('pg').types
types.setTypeParser(types.builtins.DATE, (val) => val)

async function getCreds () {
  if (process.env.DB_SECRET_NAME) {
    const secret = await secretsmanager.getSecretValue({
      SecretId: process.env.DB_SECRET_NAME,
      VersionStage: 'AWSCURRENT'
    }).promise()
    return JSON.parse(secret.SecretString)
  }
  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dbname: process.env.DB_DATABASE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }
}

const config = {
  client: 'postgresql',
  connection: async function () {
    // https://github.com/knex/knex/pull/3364
    const creds = await getCreds()
    return {
      host: creds.host,
      port: creds.port,
      database: creds.dbname || 'postgres',
      user: creds.username,
      password: creds.password
    }
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
