import Vue from 'vue'
import { externalAxios as http } from '@/plugins/axios'

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
  console.log(`usgs:getDailyFlows (${stationId}, ${startDate}, ${endDate})`)
  const values = await getFlows('dv', stationId, startDate, endDate)

  return values.map(d => ({
    date: d.dateTime.substr(0, 10),
    min: null,
    mean: Number(d.value),
    max: null,
    provisional: d.qualifiers.includes('P')
    // qualifiers: d.qualifiers
  }))
}

Vue.prototype.$usgs = {
  getInstantaneousFlows,
  getDailyFlows
}
