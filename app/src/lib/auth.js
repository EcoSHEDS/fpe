import Vue from 'vue'
import { Auth } from 'aws-amplify'

import evt from '@/events'
import store from '@/store'
import router from '@/router'

evt.$on('authState', async ({ state, redirect }) => {
  // console.log('auth:authState', state)

  switch (state) {
    case 'signedOut':
      store.dispatch('setUser', null)
      store.dispatch('setDbUser', null)
      break
    case 'signIn':
      await getUser()
      if (redirect) router.push(redirect)
      break
    case 'signInRefresh':
      await getUser(true)
      if (redirect) router.push(redirect)
      break
  }
})

export async function getAuthToken () {
  const session = await Auth.currentSession()
  return session.getIdToken().getJwtToken()
}

export async function getDbUser (userId) {
  try {
    const response = await Vue.prototype.$http.restricted.get(`/users/${userId}`)
    return response.data
  } catch (err) {
    return null
  }
}

export async function getUser (refresh) {
  try {
    const user = await Auth.currentAuthenticatedUser({ bypassCache: !!refresh })
    if (user) {
      const dbUser = await getDbUser(user.username)
      if (user.signInUserSession) {
        user.UserGroups = user.signInUserSession.accessToken.payload['cognito:groups'] || []
      } else {
        user.UserGroups = []
      }
      user.isAdmin = user.UserGroups.includes('admins')
      user.isAnnotator = user.isAdmin || dbUser.annotator

      if (!refresh) {
        evt.$emit('notify', 'success', `Logged in as ${user.attributes.email}`)
      }

      store.dispatch('setUser', user)
      store.dispatch('setDbUser', dbUser)

      return user
    } else {
      return null
    }
  } catch (err) {
    console.log(err)
    if (err.code && err.code === 'UserNotConfirmedException') {
      evt.$emit('authState', { state: 'confirmSignUp' })
    }
    evt.$emit('authState', { state: 'signedOut' })
    return null
  }
}
