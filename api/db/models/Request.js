const Base = require('./Base')

class Request extends Base {
  static get tableName () {
    return 'requests'
  }
}

module.exports = Request
