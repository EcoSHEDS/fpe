const { raw } = require('objection')
const Base = require('./Base')

class Value extends Base {
  static get tableName () {
    return 'values'
  }

  static get modifiers () {
    return {
      defaultOrderBy (builder) {
        builder.orderBy('timestamp')
      },
      defaultSelect (builder) {
        builder.select('timestamp', 'value')
      },
      daily (builder) {
        builder
          .select(
            raw('to_char(timestamp, \'YYYY-MM-DD\') as date'),
            raw('min(value) as min'),
            raw('avg(value) as mean'),
            raw('max(value) as max')
          )
          .groupBy([raw('to_char(timestamp, \'YYYY-MM-DD\')'), 'series_id'])
          .orderBy('date')
      }
    }
  }

  static get relationMappings () {
    const Series = require('./Series')
    return {
      series: {
        relation: Base.BelongsToOneRelation,
        modelClass: Series,
        join: {
          from: 'values.series_id',
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

module.exports = Value
