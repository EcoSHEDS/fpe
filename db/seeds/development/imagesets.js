
exports.seed = knex => knex('imagesets').del()
  .then(() => Promise.all([
    knex.table('stations').first().where({ name: 'Station 001' }),
    knex.table('cameras').first().where({ name: 'Camera 001' })
  ]))
  .then(([station, camera]) => knex('imagesets').insert([
    {
      station_id: station.id,
      camera_id: camera.id,
      config: '{}',
      status: 'DONE'
    }
  ]))
