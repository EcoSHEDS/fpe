const Base = require('./Base')

class Series extends Base {
  static get tableName () {
    return 'series'
  }

  static get relationMappings () {
    const Dataset = require('./Dataset')
    const Variable = require('./Variable')
    const Observation = require('./Observation')
    return {
      dataset: {
        relation: Base.BelongsToOneRelation,
        modelClass: Dataset,
        join: {
          from: 'series.dataset_id',
          to: 'datasets.id'
        }
      },
      variable: {
        relation: Base.BelongsToOneRelation,
        modelClass: Variable,
        join: {
          from: 'series.variable_id',
          to: 'variables.id'
        }
      },
      observations: {
        relation: Base.HasManyRelation,
        modelClass: Observation,
        join: {
          from: 'series.id',
          to: 'observations.series_id'
        }
      }
    }
  }
}

module.exports = Series
