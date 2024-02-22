import Vue from 'vue'
import HighchartsVue from 'highcharts-vue'
import Highcharts from 'highcharts'
import more from 'highcharts/highcharts-more'
import stockInit from 'highcharts/modules/stock'
// import exportInit from 'highcharts/modules/exporting'
import noData from 'highcharts/modules/no-data-to-display'

stockInit(Highcharts)

more(Highcharts)
noData(Highcharts)
// exportInit(Highcharts)

Highcharts.setOptions({
  lang: {
    thousandsSep: ',',
    noData: 'No data to display'
  },
  time: {
    dateFormat: '%b %e, %y'
  },
  colors: [
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf'
  ]
})

Vue.use(HighchartsVue)
