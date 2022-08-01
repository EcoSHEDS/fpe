exports.seed = knex => knex('variables').insert([
  { id: 'FLOW_CFS', description: 'Streamflow (cfs)' },
  { id: 'STAGE_FT', description: 'Stage (ft)' },
  { id: 'PRESSURE_KPA', description: 'Pressure (kPa)' },
  { id: 'SPCOND_USCM25', description: 'Specific Conductivity (uS/cm @ 25 degC)' },
  { id: 'WTEMP_C', description: 'Water Temperature (C)' },
  { id: 'ATEMP_C', description: 'Air Temperature (C)' },
  { id: 'OTHER', description: 'Other' }
])
