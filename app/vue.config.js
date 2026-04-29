const packageInfo = require('./package.json')
process.env.VUE_APP_VERSION = packageInfo.version
module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  publicPath: process.env.BASE_URL || '/'
}
