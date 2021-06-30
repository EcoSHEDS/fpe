const Base = require('./Base')

class Station extends Base {
  static get tableName () {
    return 'stations'
  }

  static get relationMappings () {
    const Dataset = require('./Dataset')
    const Imageset = require('./Imageset')
    const User = require('./User')
    return {
      user: {
        relation: Base.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'stations.user_id',
          to: 'users.id'
        }
      },
      datasets: {
        relation: Base.HasManyRelation,
        modelClass: Dataset,
        join: {
          from: 'stations.id',
          to: 'datasets.station_id'
        }
      },
      imagesets: {
        relation: Base.HasManyRelation,
        modelClass: Imageset,
        join: {
          from: 'stations.id',
          to: 'imagesets.station_id'
        }
      }
    }
  }
}

module.exports = Station
