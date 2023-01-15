import Vue from 'vue'
import { Amplify } from 'aws-amplify'
import * as AmplifyModules from 'aws-amplify'
import { AmplifyPlugin } from 'aws-amplify-vue'

Amplify.configure({
  Auth: {
    region: process.env.VUE_APP_COGNITO_REGION,
    userPoolId: process.env.VUE_APP_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.VUE_APP_COGNITO_CLIENT_ID
  }
})

Vue.use(AmplifyPlugin, AmplifyModules)
