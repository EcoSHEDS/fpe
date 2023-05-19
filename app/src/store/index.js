import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null,
    dbUser: null
  },
  getters: {
    user: state => state.user,
    userId: state => state.user ? state.user.username : null,
    dbUser: state => state.dbUser
  },
  mutations: {
    SET_USER (state, user) {
      state.user = user
    },
    SET_DB_USER (state, dbUser) {
      state.dbUser = dbUser
    }
  },
  actions: {
    setUser ({ commit }, user) {
      commit('SET_USER', user)
      return user
    },
    setDbUser ({ commit }, dbUser) {
      commit('SET_DB_USER', dbUser)
      return dbUser
    }
  }
})
