import Vue from 'vue'
import { DateTime } from 'luxon'
import { waterbodyTypes, stationStatusTypes } from '@/lib/constants'
import { dateFormat, timestampFormat } from '@/lib/time'

Vue.filter('timestampFromNow', (v) => {
  if (typeof v === 'string') {
    v = new Date(v)
  }
  return DateTime.fromJSDate(v).toRelative()
})

Vue.filter('formatDate', dateFormat)
Vue.filter('formatTimestamp', timestampFormat)

Vue.filter('waterbodyType', (v) => {
  const x = waterbodyTypes.find(d => d.value === v)
  return x ? x.label : ''
})
Vue.filter('stationStatus', (v) => {
  const x = stationStatusTypes.find(d => d.value === v)
  return x ? x.label : ''
})
