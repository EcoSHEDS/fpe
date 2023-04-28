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
          'pii_person', 'pii_vehicle', 'pii_user'
        )
      },
      excludePii (builder) {
        builder
          .where('pii_person', '<', 0.8)
          .andWhere('pii_vehicle', '<', 0.8)
          .andWhere('pii_user', false)
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
