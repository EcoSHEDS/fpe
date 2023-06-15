const Base = require('./Base')
const Annotation = require('./Annotation')

class Station extends Base {
  static get tableName () {
    return 'stations'
  }

  static get modifiers () {
    return {
      annotationSummary (builder) {
        builder.select(
          '*',
          Station.relatedQuery('annotations')
            .sum('n')
            .as('n_annotations')
        )
      }
    }
  }

  static get relationMappings () {
    const Annotation = require('./Annotation')
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
      annotations: {
        relation: Base.HasManyRelation,
        modelClass: Annotation,
        join: {
          from: 'stations.id',
          to: 'annotations.station_id'
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
