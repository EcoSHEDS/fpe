import Vue from 'vue'
import { Auth } from 'aws-amplify'

import evt from '@/events'
import store from '@/store'
import router from '@/router'

evt.$on('authState', async ({ state, redirect }) => {
  if (state === 'signedOut') {
    store.dispatch('setUser', null)
    router.push(redirect || { name: 'logout' })
  } else if (state === 'signIn') {
    await getUser()
    if (redirect) router.push(redirect)
  } else if (state === 'signInRefresh') {
    await getUser(true)
    if (redirect) router.push(redirect)
  } else if (state === 'confirmSignUp') {
    router.push({ name: 'signupConfirm' })
  }
})

export async function getToken () {
  const session = await Auth.currentSession()
  return session.getIdToken().getJwtToken()
}

export async function getAffiliation (userId) {
  try {
    const response = await Vue.prototype.$http.restricted.get(`/users/${userId}`)
    return response.data
  } catch (err) {
    return null
  }
}

export async function getUser (force) {
  try {
    const user = await Auth.currentAuthenticatedUser({ bypassCache: !!force })
    if (user && user.signInUserSession) {
      const affiliation = await getAffiliation(user.username)
      user.UserGroups = user.signInUserSession.accessToken.payload['cognito:groups'] || []
      user.isAdmin = user.UserGroups.includes('admins')
      store.dispatch('setUser', user)
      store.dispatch('setAffiliation', affiliation)
      return user
    }
    return null
  } catch (err) {
    if (err.code && err.code === 'UserNotConfirmedException') {
      evt.$emit('authState', { state: 'confirmSignUp' })
    }
    // console.log('getUser() failed', err)
    store.dispatch('setUser', null)
    return null
  }
}
