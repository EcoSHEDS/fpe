
exports.seed = knex => knex('imagesets').del()
  .then(() => Promise.all([
    knex.table('stations').first().where({ name: 'Station 001' }),
    knex.table('cameras').first().where({ name: 'Camera 001' })
  ]))
  .then(([station, camera]) => knex('imagesets')
    .insert({
      station_id: station.id,
      camera_id: camera.id,
      n_images: 5,
      config: '{}',
      status: 'DONE'
    }).returning('*')
  )
  .then(([imageset]) => knex('images')
    .insert([
      {
        imageset_id: imageset.id,
        timestamp: '2020-07-16T00:00Z',
        filename: 'photo001.jpg',
        url: 'http://example.org/photo001.jpg',
        metadata: '{}',
        status: 'DONE'
      },
      {
        imageset_id: imageset.id,
        timestamp: '2020-07-16T01:00Z',
        filename: 'photo002.jpg',
        url: 'http://example.org/photo002.jpg',
        metadata: '{}',
        status: 'DONE'
      },
      {
        imageset_id: imageset.id,
        timestamp: '2020-07-16T02:00Z',
        filename: 'photo003.jpg',
        url: 'http://example.org/photo003.jpg',
        metadata: '{}',
        status: 'DONE'
      },
      {
        imageset_id: imageset.id,
        timestamp: '2020-07-16T03:00Z',
        filename: 'photo004.jpg',
        url: 'http://example.org/photo004.jpg',
        metadata: '{}',
        status: 'DONE'
      },
      {
        imageset_id: imageset.id,
        timestamp: '2020-07-16T04:00Z',
        filename: 'photo005.jpg',
        url: 'http://example.org/photo005.jpg',
        metadata: '{}',
        status: 'DONE'
      }
    ])
  )
