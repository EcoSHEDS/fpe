const Base = require('./Base')

class Model extends Base {
  static get tableName () {
    return 'models'
  }

  static get modifiers () {
    return {
      done (builder) {
        builder.where('status', 'DONE')
      }
    }
  }

  static get relationMappings () {
    const Station = require('./Station')
    const ModelType = require('./ModelType')
    return {
      station: {
        relation: Base.BelongsToOneRelation,
        modelClass: Station,
        join: {
          from: 'models.station_id',
          to: 'stations.id'
        }
      },
      modelType: {
        relation: Base.BelongsToOneRelation,
        modelClass: ModelType,
        join: {
          from: 'models.model_type_id',
          to: 'model_types.id'
        }
      }
    }
  }
}

module.exports = Model
