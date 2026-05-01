const Base = require('./Base')
const knex = require('../knex')

class Station extends Base {
  static get tableName () {
    return 'stations'
  }

  static get modifiers () {
    return {
      annotationSummary (builder) {
        builder.select(
          '*',
          knex.raw(`
            coalesce((
              select json_object_agg(
                variable,
                json_build_object(
                  'n_annotations', n_annotations,
                  'n_annotations_daytime', n_annotations_daytime
                )
              )
              from (
                select
                  annotations.variable,
                  sum(annotations.n)::integer as n_annotations,
                  sum(annotations.n_daytime)::integer as n_annotations_daytime
                from annotations
                where annotations.station_id = stations.id
                  and annotations.flag = false
                  and annotations.status = 'DONE'
                group by annotations.variable
              ) annotation_counts
            ), '{}'::json) as annotation_counts_by_variable
          `)
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
