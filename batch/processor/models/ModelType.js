const Base = require('./Base')

class ModelType extends Base {
  static get tableName () {
    return 'model_types'
  }

  $beforeInsert () { }

  $beforeUpdate () { }
}

module.exports = ModelType
