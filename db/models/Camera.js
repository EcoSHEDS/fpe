const Base = require('./Base')

class Camera extends Base {
  static get tableName () {
    return 'cameras'
  }

  static get relationMappings () {
    const User = require('./User')
    const Imageset = require('./Imageset')
    return {
      camera: {
        relation: Base.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'cameras.user_id',
          to: 'users.id'
        }
      },
      imagesets: {
        relation: Base.HasManyRelation,
        modelClass: Imageset,
        join: {
          from: 'cameras.id',
          to: 'imagesets.camera_id'
        }
      }
    }
  }
}

module.exports = Camera
