const Base = require('./Base')

class Dataset extends Base {
  static get tableName () {
    return 'datasets'
  }

  static get relationMappings () {
    const Station = require('./Station')
    const Series = require('./Series')
    return {
      station: {
        relation: Base.BelongsToOneRelation,
        modelClass: Station,
        join: {
          from: 'datasets.station_id',
          to: 'stations.id'
        }
      },
      series: {
        relation: Base.HasManyRelation,
        modelClass: Series,
        join: {
          from: 'datasets.id',
          to: 'series.dataset_id'
        }
      }
    }
  }
}

module.exports = Dataset
