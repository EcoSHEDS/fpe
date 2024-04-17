import Vue from 'vue'

import App from './App.vue'
import router from './router'
import store from './store'

import vuetify from './plugins/vuetify'

import './filters'

import './plugins/amplify'
import './plugins/axios'
import './plugins/error-message'
import './plugins/highcharts'
import './plugins/leaflet'
import './plugins/luxon'
import './plugins/vue-filter-pretty-bytes'

import Alert from '@/components/Alert'
import RefreshButton from '@/components/RefreshButton'
Vue.component('Alert', Alert)
Vue.component('RefreshButton', RefreshButton)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
