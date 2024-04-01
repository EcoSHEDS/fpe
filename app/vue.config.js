const package = require('./package.json')
process.env.VUE_APP_VERSION = package.version
module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  publicPath: process.env.BASE_URL || '/'
}
