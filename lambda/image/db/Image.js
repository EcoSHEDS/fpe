const Base = require('./Base')

class Image extends Base {
  static get tableName () {
    return 'images'
  }

  static get relationMappings () {
    const Imageset = require('./Imageset')
    return {
      imageset: {
        relation: Base.BelongsToOneRelation,
        modelClass: Imageset,
        join: {
          from: 'images.imageset_id',
          to: 'imageset.id'
        }
      }
    }
  }
}

module.exports = Image
