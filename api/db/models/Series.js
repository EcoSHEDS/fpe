const Base = require('./Base')

class Series extends Base {
  static get tableName () {
    return 'series'
  }

  static get relationMappings () {
    const Dataset = require('./Dataset')
    const Variable = require('./Variable')
    const Value = require('./Value')
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
      values: {
        relation: Base.HasManyRelation,
        modelClass: Value,
        join: {
          from: 'values.series_id',
          to: 'series.id'
        }
      }
    }
  }
}

module.exports = Series
