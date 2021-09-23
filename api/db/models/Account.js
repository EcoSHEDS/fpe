const Base = require('./Base')

class Account extends Base {
  static get tableName () {
    return 'accounts'
  }
}

module.exports = Account
