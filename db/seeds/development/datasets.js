
exports.seed = knex => knex('datasets').del()
  .then(() => knex.table('stations').first().where({ name: 'Station 001' }))
  .then((station) => knex('datasets').insert([
    {
      station_id: station.id,
      url: 'http://example.org/dataset.csv',
      filename: 'dataset.csv',
      config: '{}',
      status: 'DONE'
    }
  ]))
