const Base = require('./Base')

class Observation extends Base {
  static get tableName () {
    return 'observations'
  }

  static get relationMappings () {
    const Series = require('./Series')
    return {
      series: {
        relation: Base.BelongsToOneRelation,
        modelClass: Series,
        join: {
          from: 'observations.series_id',
          to: 'seriess.id'
        }
      }
    }
  }

  $beforeInsert () {
  }

  $beforeUpdate () {
  }
}

module.exports = Observation
