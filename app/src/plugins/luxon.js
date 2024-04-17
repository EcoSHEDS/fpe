import Vue from 'vue'
const luxon = require('luxon')

const { Settings } = luxon
Settings.defaultZone = 'UTC'

Object.defineProperties(Vue.prototype, {
  $luxon: {
    get () {
      return luxon
    }
  }
})

window.luxon = luxon
