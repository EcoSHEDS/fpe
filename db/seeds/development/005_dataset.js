
exports.seed = knex => knex('datasets').del()
  .then(() => knex.table('stations').first().where({ name: 'Station 001' }))
  .then((station) => knex('datasets')
    .insert({
      station_id: station.id,
      url: 'http://example.org/dataset.csv',
      filename: 'dataset.csv',
      config: '{}',
      status: 'DONE'
    }).returning('*')
  )
  .then(([dataset]) => knex('series')
    .insert({
      dataset_id: dataset.id,
      variable_id: 'FLOW_CFS',
      start_timestamp: '2020-07-16T00:00Z',
      end_timestamp: '2020-07-16T04:00Z',
      n_values: 5
    }).returning('*')
  )
  .then(([series]) => knex('observations')
    .insert([
      {
        series_id: series.id,
        timestamp: '2020-07-16T00:00Z',
        value: '1.23'
      },
      {
        series_id: series.id,
        timestamp: '2020-07-16T01:00Z',
        value: '1.34'
      },
      {
        series_id: series.id,
        timestamp: '2020-07-16T02:00Z',
        value: '1.45'
      },
      {
        series_id: series.id,
        timestamp: '2020-07-16T03:00Z',
        value: '1.56'
      },
      {
        series_id: series.id,
        timestamp: '2020-07-16T04:00Z',
        value: '1.67'
      }
    ])
  )
