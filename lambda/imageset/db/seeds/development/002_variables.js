exports.seed = knex => knex('variables').del()
  .then(() => knex('variables').insert([
    { id: 'FLOW_CFS', description: 'Streamflow (cfs)' },
    { id: 'STAGE_FT', description: 'Stage (ft)' }
  ]))
