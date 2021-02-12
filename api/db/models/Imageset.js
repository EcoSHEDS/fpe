const Base = require('./Base')

class Imageset extends Base {
  static get tableName () {
    return 'imagesets'
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
