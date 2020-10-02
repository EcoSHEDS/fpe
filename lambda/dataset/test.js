require('dotenv-flow').config({
  path: '../../'
})
const lambda = require('./index')

// const { Dataset } = require('./db/models')
// Dataset.query().then(results => console.log(results))
lambda.handler({
  id: 6
})
