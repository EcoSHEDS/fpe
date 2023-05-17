const { raw } = require('objection')
const Base = require('./Base')

class Image extends Base {
  static get tableName () {
    return 'images'
  }

  static get modifiers () {
    return {
      defaultOrderBy (builder) {
        builder.orderBy('filename')
      },
      defaultSelect (builder) {
        builder.select(
          'id', 'imageset_id',
          'filename', 'timestamp',
          'full_url', 'thumb_url',
          'status', 'error_message',
          'pii_person', 'pii_vehicle', 'pii_animal', 'pii_on', 'pii_off'
        )
      },
      excludePii (builder) {
        builder.whereNot(raw('image_has_pii(pii_person, pii_vehicle, pii_on, pii_off)'))
      },
      daily (builder) {
        builder
          .select(
            'id', 'imageset_id',
            'filename', 'timestamp',
            'full_url', 'thumb_url'
          )
          .where('status', 'DONE')
          .orderBy('timestamp')
      }
    }
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
