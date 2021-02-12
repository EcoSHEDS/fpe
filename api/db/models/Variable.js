const Base = require('./Base')

class Variable extends Base {
  static get tableName () {
    return 'variables'
  }

  $beforeInsert () {
  }

  $beforeUpdate () {
  }
}

module.exports = Variable
