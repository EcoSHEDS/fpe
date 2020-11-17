require('dotenv-flow').config({
  path: '../../'
})
const lambda = require('./index')

lambda.testHandler({
  id: 1
})
