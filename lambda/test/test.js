require('dotenv-flow').config({
  path: '../../'
})
const lambda = require('./index')

lambda.handler({
  id: 1
})
