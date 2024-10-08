const Base = require('./Base')

class StationPermission extends Base {
  static get tableName () {
    return 'stations_permissions'
  }

  static get relationMappings () {
    const Station = require('./Station')
    const User = require('./User')
    return {
      station: {
        relation: Base.BelongsToOneRelation,
        modelClass: Station,
        join: {
          from: 'stations_permissions.station_id',
          to: 'stations.id'
        }
      },
      user: {
        relation: Base.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'stations_permissions.user_id',
          to: 'users.id'
        }
      }
    }
  }

  $beforeInsert () { }

  $beforeUpdate () { }
}

module.exports = StationPermission
