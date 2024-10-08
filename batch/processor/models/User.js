const Base = require('./Base')

class User extends Base {
  static get tableName () {
    return 'users'
  }

  static get relationMappings () {
    const Station = require('./Station')
    const StationPermission = require('./StationPermission')

    return {
      stations: {
        relation: Base.HasManyRelation,
        modelClass: Station,
        join: {
          from: 'users.id',
          to: 'stations.user_id'
        }
      },
      stationPermissions: {
        relation: Base.HasManyRelation,
        modelClass: StationPermission,
        join: {
          from: 'users.id',
          to: 'stations_permissions.user_id'
        }
      },
      permittedStations: {
        relation: Base.ManyToManyRelation,
        modelClass: Station,
        join: {
          from: 'users.id',
          through: {
            from: 'stations_permissions.user_id',
            to: 'stations_permissions.station_id'
          },
          to: 'stations.id'
        }
      }
    }
  }
}

module.exports = User
