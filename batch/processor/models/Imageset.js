const Base = require('./Base')

class Imageset extends Base {
  static get tableName () {
    return 'imagesets'
  }

  static get modifiers () {
    return {
      done (builder) {
        builder.where('status', 'DONE')
      },
      imageSummary (builder) {
        builder.select(
          '*',
          Imageset.relatedQuery('images')
            .count()
            .as('n_images'),
          Imageset.relatedQuery('images')
            .min('timestamp')
            .as('start_timestamp'),
          Imageset.relatedQuery('images')
            .max('timestamp')
            .as('end_timestamp')
        )
      }
    }
  }

  static get relationMappings () {
    const Station = require('./Station')
    const Image = require('./Image')
    return {
      station: {
        relation: Base.BelongsToOneRelation,
        modelClass: Station,
        join: {
          from: 'imagesets.station_id',
          to: 'stations.id'
        }
      },
      images: {
        relation: Base.HasManyRelation,
        modelClass: Image,
        join: {
          from: 'imagesets.id',
          to: 'images.imageset_id'
        }
      }
    }
  }
}

module.exports = Imageset
