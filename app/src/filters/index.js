import dayjs from 'dayjs'
import * as d3 from 'd3'
import Vue from 'vue'
import { waterbodyTypes, stationStatusTypes } from '@/lib/constants'

Vue.filter('d3Format', (v, format) => d3.format(format)(v))
Vue.filter('timestampFromNow', (v) => dayjs(v).fromNow())
Vue.filter('timestampFormat', (v, format) => dayjs(v).format(format))
Vue.filter('timestampLocalFormat', (v, tz, format) => dayjs(v).tz(tz).format(format))
Vue.filter('waterbodyType', (v) => {
  const x = waterbodyTypes.find(d => d.value === v)
  return x ? x.label : ''
})
Vue.filter('stationStatus', (v) => {
  const x = stationStatusTypes.find(d => d.value === v)
  return x ? x.label : ''
})
