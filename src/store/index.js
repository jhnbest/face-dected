import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    client_id: '08827a8009f84f7d9745a2780051a749',
    client_secret: '7af200e20068414c897fa4c223e4f6ae',
    accessToken: null,
    tokenType: null
  },
  getters: {
  },
  mutations: {
    updateToken(state, accessToken) {
      state.accessToken = accessToken
    },
    updateTokenType(state, tokenType) {
      state.tokenType = tokenType
    }
  },
  actions: {
  },
  modules: {
  }
})
