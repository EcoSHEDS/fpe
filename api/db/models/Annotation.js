const Base = require('./Base')

class Annotation extends Base {
  static get tableName () {
    return 'annotations'
  }

  static get relationMappings () {
    const Station = require('./Station')
    const User = require('./User')
    const Variable = require('./Variable')
    return {
      user: {
        relation: Base.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'annotations.user_id',
          to: 'users.id'
        }
      },
      station: {
        relation: Base.BelongsToOneRelation,
        modelClass: Station,
        join: {
          from: 'annotations.station_id',
          to: 'stations.id'
        }
      },
      variable: {
        relation: Base.BelongsToOneRelation,
        modelClass: Variable,
        join: {
          from: 'annotations.variable_id',
          to: 'variables.id'
        }
      }
    }
  }
}

module.exports = Annotation
