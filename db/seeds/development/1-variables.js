const Variable = require('../../models/Variable')
const variables = require('./data/variables.json')

exports.seed = async knex => {
  Variable.knex(knex)
  await knex('variables').del()
  await Variable.query().insert(variables)
}
