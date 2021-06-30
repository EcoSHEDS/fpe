const Base = require('./Base')

class User extends Base {
  static get tableName () {
    return 'users'
  }

  static get relationMappings () {
    const Station = require('./Station')
    return {
      stations: {
        relation: Base.HasManyRelation,
        modelClass: Station,
        join: {
          from: 'users.id',
          to: 'stations.user_id'
        }
      }
    }
  }
}

module.exports = User
