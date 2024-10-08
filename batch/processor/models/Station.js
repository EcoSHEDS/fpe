const Base = require('./Base')

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
            .where('flag', 'false')
            .sum('n').as('n_annotations'),
          Station.relatedQuery('annotations')
            .where('flag', 'false')
            .sum('n_daytime').as('n_annotations_daytime')
        )
      }
    }
  }

  static get relationMappings () {
    return {
      user: {
        relation: Base.BelongsToOneRelation,
        modelClass: require('./User'),
        join: {
          from: 'stations.user_id',
          to: 'users.id'
        }
      },
      annotations: {
        relation: Base.HasManyRelation,
        modelClass: require('./Annotation'),
        join: {
          from: 'stations.id',
          to: 'annotations.station_id'
        }
      },
      datasets: {
        relation: Base.HasManyRelation,
        modelClass: require('./Dataset'),
        join: {
          from: 'stations.id',
          to: 'datasets.station_id'
        }
      },
      imagesets: {
        relation: Base.HasManyRelation,
        modelClass: require('./Imageset'),
        join: {
          from: 'stations.id',
          to: 'imagesets.station_id'
        }
      },
      models: {
        relation: Base.HasManyRelation,
        modelClass: require('./Model'),
        join: {
          from: 'stations.id',
          to: 'models.station_id'
        }
      },
      permissions: {
        relation: Base.HasManyRelation,
        modelClass: require('./StationPermission'),
        join: {
          from: 'stations.id',
          to: 'stations_permissions.station_id'
        }
      },
      permittedUsers: {
        relation: Base.ManyToManyRelation,
        modelClass: require('./User'),
        join: {
          from: 'stations.id',
          through: {
            from: 'stations_permissions.station_id',
            to: 'stations_permissions.user_id'
          },
          to: 'users.id'
        }
      }
    }
  }
}

module.exports = Station
