const Base = require('./Base')

class Variable extends Base {
  static get tableName () {
    return 'variables'
  }
}

module.exports = Variable
