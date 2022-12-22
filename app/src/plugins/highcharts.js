import Vue from 'vue'
import HighchartsVue from 'highcharts-vue'
import Highcharts from 'highcharts'
import more from 'highcharts/highcharts-more'
import stockInit from 'highcharts/modules/stock'
// import exportInit from 'highcharts/modules/exporting'
// import boost from 'highcharts/modules/boost'
import noData from 'highcharts/modules/no-data-to-display'

stockInit(Highcharts)

more(Highcharts)
// boost(Highcharts)
noData(Highcharts)
// exportInit(Highcharts)

Highcharts.setOptions({
  lang: {
    thousandsSep: ','
  },
  colors: ['#004895']
})

Vue.use(HighchartsVue)
