import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null,
    affiliation: null
  },
  getters: {
    user: state => state.user,
    userId: state => state.user ? state.user.username : null,
    affiliation: state => state.affiliation
  },
  mutations: {
    SET_USER (state, user) {
      state.user = user
    },
    SET_AFFILIATION (state, affiliation) {
      state.affiliation = affiliation
    }
  },
  actions: {
    setUser ({ commit }, user) {
      commit('SET_USER', user)
      return user
    },
    setAffiliation ({ commit }, affiliation) {
      commit('SET_AFFILIATION', affiliation)
      return affiliation
    }
  }
})
