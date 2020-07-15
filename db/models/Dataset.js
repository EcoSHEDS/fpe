const Base = require('./Base')

class Dataset extends Base {
  static get tableName () {
    return 'datasets'
  }

  static get relationMappings () {
    const Station = require('./Station')
    const Variable = require('./Variable')
    return {
      station: {
        relation: Base.BelongsToOneRelation,
        modelClass: Station,
        join: {
          from: 'datasets.station_id',
          to: 'stations.id'
        }
      },
      variable: {
        relation: Base.BelongsToOneRelation,
        modelClass: Variable,
        join: {
          from: 'datasets.variable_id',
          to: 'variables.id'
        }
      }
    }
  }
}

module.exports = Dataset
