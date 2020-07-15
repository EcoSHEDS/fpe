const Base = require('./Base')

class Imageset extends Base {
  static get tableName () {
    return 'imagesets'
  }

  static get relationMappings () {
    const Station = require('./Station')
    const Camera = require('./Camera')
    return {
      station: {
        relation: Base.BelongsToOneRelation,
        modelClass: Station,
        join: {
          from: 'imagesets.station_id',
          to: 'stations.id'
        }
      },
      camera: {
        relation: Base.BelongsToOneRelation,
        modelClass: Camera,
        join: {
          from: 'imagesets.camera_id',
          to: 'cameras.id'
        }
      }
    }
  }
}

module.exports = Imageset
