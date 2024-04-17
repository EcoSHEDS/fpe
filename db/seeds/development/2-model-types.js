const ModelType = require('../../models/ModelType')
const modelTypes = require('./data/modelTypes.json')

exports.seed = async knex => {
  ModelType.knex(knex)
  await knex('model_types').del()
  await ModelType.query().insert(modelTypes)
}
