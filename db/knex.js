const env = process.env.NODE_ENV || 'development'
const config = require('../knexfile.js')[env]
module.exports = require('knex')(config)
