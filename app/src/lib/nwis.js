import http from 'axios'

const parameterCodes = {
  FLOW_CFS: '00060',
  STAGE_FT: '00065'
}

async function getStation (id) {
  const url = `https://waterservices.usgs.gov/nwis/site/?format=rdb&sites=${id}`
  try {
    const text = await http.get(url).then(d => d.data)
    const values = text.split('\n').filter(d => d[0] !== '#')[2].split('\t')
    return {
      agency_cd: values[0],
      site_no: values[1],
      station_nm: values[2],
      site_tp_cd: values[3],
      dec_lat_va: values[4],
      dec_long_va: values[5],
      coord_acy_cd: values[6],
      dec_coord_datum_cd: values[7],
      alt_va: values[8],
      alt_acy_va: values[9],
      alt_datum_cd: values[10],
      huc_cd: values[11]
    }
  } catch (err) {
    throw new Error(`Failed to fetch station (${id}) from USGS NWIS`)
  }
}

async function getData (service, stationId, startDate, endDate, variable = 'FLOW_CFS') {
  const parameterCd = parameterCodes[variable]
  if (!parameterCd) throw new Error(`Invalid variable: ${variable}`)

  let url = `https://nwis.waterservices.usgs.gov/nwis/${service}/?format=json&sites=${stationId}&startDT=${startDate}&endDT=${endDate}&parameterCd=${parameterCd}&siteStatus=all`
  if (service === 'dv') {
    url += '&statCd=00003'
  }
  const json = await http.get(url).then(d => d.data)

  if (json.value.timeSeries.length === 0) return []

  return json.value.timeSeries[0].values[0].value
}

async function getInstantaneousValues (stationId, startDate, endDate, variable = 'FLOW_CFS') {
  const values = await getData('iv', stationId, startDate, endDate, variable)

  return values.map(d => ({
    timestamp: new Date(d.dateTime),
    value: Number(d.value),
    provisional: d.qualifiers.includes('P')
    // qualifiers: d.qualifiers
  }))
}

async function getDailyValues (stationId, startDate, endDate, variable = 'FLOW_CFS') {
  const values = await getData('dv', stationId, startDate, endDate, variable)

  const x = values.map(d => ({
    date: d.dateTime.substr(0, 10),
    min: null,
    mean: Number(d.value),
    max: null,
    provisional: d.qualifiers.includes('P')
    // qualifiers: d.qualifiers
  })).filter(d => d.mean >= 0)
  return x
}

export default {
  getStation,
  getData,
  getInstantaneousValues,
  getDailyValues
}
