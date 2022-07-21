import Vue from 'vue'

Vue.prototype.$errorMessage = function (error) {
  if (error.response) {
    if (error.response.data && error.response.data.message) {
      return error.response.data.message
    }
  }
  if (error.message) {
    return error.message
  }
  return error.toString() || 'Unknown error'
}
