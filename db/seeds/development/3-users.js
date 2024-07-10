const fs = require('fs')
const User = require('../../models/User')

exports.seed = async (knex) => {
  User.knex(knex)
  await knex.raw('set timezone to "UTC"')
  await knex('stations').del()
  await knex('users').del()

  const userIds = fs.readdirSync(`${__dirname}/data/users`)
  const users = userIds.map((userId) => {
    const user = require(`./data/users/${userId}/user.json`)
    const stationIds = fs.readdirSync(
      `${__dirname}/data/users/${userId}/stations`
    )
    user.stations = stationIds.map((stationId) => {
      console.log(`loading station: ${stationId}`)
      const stationDir = `${__dirname}/data/users/${userId}/stations/${stationId}`
      const station = require(`${stationDir}/db/station.json`)

      const imagesetsDir = `${stationDir}/db/imagesets`
      if (fs.existsSync(imagesetsDir)) {
        const imagesetIds = fs.readdirSync(imagesetsDir)
        station.imagesets = imagesetIds.map((imagesetId) => {
          console.log(`loading imageset: ${imagesetId}`)
          const imageset = require(`${imagesetsDir}/${imagesetId}/imageset.json`)
          imageset.images = require(`${imagesetsDir}/${imagesetId}/images.json`)
          return imageset
        })
      } else {
        station.imagesets = []
      }

      const datasetDir = `${__dirname}/data/users/${userId}/stations/${stationId}/db/datasets`
      if (fs.existsSync(datasetDir)) {
        const datasetIds = fs.readdirSync(datasetDir)
        station.datasets = datasetIds.map((datasetId) => {
          console.log(`loading dataset: ${datasetId}`)
          const dataset = require(`${datasetDir}/${datasetId}/dataset.json`)
          const seriesIds = fs.readdirSync(
            `${datasetDir}/${datasetId}/series`
          )
          dataset.series = seriesIds.map((variableFile) => {
            const variableId = variableFile.replace('.json', '')
            console.log(`loading series: ${variableId}`)
            const series = { variable_id: variableId }
            series.values = require(`${datasetDir}/${datasetId}/series/${variableFile}`)
              .filter(d => Object.keys(d).includes('value'))
            return series
          })
          return dataset
        })
      } else {
        station.datasets = []
      }

      const modelDir = `${__dirname}/data/users/${userId}/stations/${stationId}/db/models`
      if (fs.existsSync(modelDir)) {
        const modelIds = fs.readdirSync(modelDir)
        station.models = modelIds.map((modelId) => {
          console.log(`loading model: ${modelId}`)
          const model = require(`${modelDir}/${modelId}/model.json`)
          return model
        })
      } else {
        station.models = []
      }

      const annotationsFile = `${__dirname}/data/users/${userId}/stations/${stationId}/db/annotations.json`
      if (fs.existsSync(annotationsFile)) {
        console.log(`loading annotations: ${annotationsFile}`)
        station.annotations = require(annotationsFile)
        station.annotations.forEach((annotation) => {
          annotation.user_id = user.id
        })
      } else {
        station.annotations = []
      }

      return station
    })
    return user
  })

  const jsonString = JSON.stringify(users).replace(/{STORAGE_BUCKET}/g, process.env.BUCKET)

  await User.query().insertGraph(JSON.parse(jsonString))
}
