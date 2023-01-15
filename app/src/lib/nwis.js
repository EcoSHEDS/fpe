import http from 'axios'

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

async function getFlows (service, stationId, startDate, endDate) {
  const url = `https://nwis.waterservices.usgs.gov/nwis/${service}/?format=json&sites=${stationId}&startDT=${startDate}&endDT=${endDate}&parameterCd=00060&siteStatus=all`
  const json = await http.get(url).then(d => d.data)

  if (json.value.timeSeries.length === 0) return []

  return json.value.timeSeries[0].values[0].value
}

async function getInstantaneousFlows (stationId, startDate, endDate) {
  const values = await getFlows('iv', stationId, startDate, endDate)

  return values.map(d => ({
    timestamp: d.dateTime,
    value: Number(d.value),
    provisional: d.qualifiers.includes('P')
    // qualifiers: d.qualifiers
  }))
}

async function getDailyFlows (stationId, startDate, endDate) {
  const values = await getFlows('dv', stationId, startDate, endDate)

  const x = values.map(d => ({
    date: d.dateTime.substr(0, 10),
    min: null,
    mean: Number(d.value),
    max: null,
    provisional: d.qualifiers.includes('P')
    // qualifiers: d.qualifiers
  }))
  x[10].provisional = true
  return x
}

export default {
  getStation,
  getFlows,
  getInstantaneousFlows,
  getDailyFlows
}
