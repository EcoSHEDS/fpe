const { Station } = require('../models')

async function processStation (id, dryRun) {
  if (dryRun) console.log('dryRun: on')
  console.log(`processing station (id=${id})`)

  console.log(`fetching station record (id=${id})`)
  const station = await Station.query().findById(id)
  if (!station) throw new Error(`Station record (id=${id}) not found`)

  // TODO generate daily
  // TODO generate image/data values

  console.log(`finished (id=${id})`)
}

module.exports = async function (id, { dryRun }) {
  try {
    await processStation(id, dryRun)
  } catch (e) {
    console.log(`failed (id=${id}): ${e.message || e.toString()}`)
    console.error(e)
  }
}
