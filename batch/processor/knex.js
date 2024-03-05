const AWS = require('aws-sdk')
require('dotenv').config()

const secretsmanager = new AWS.SecretsManager({
  region: process.env.REGION
})

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
  }
}

module.exports = require('knex')(config)
