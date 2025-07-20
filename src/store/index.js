import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    client_id: '08827a8009f84f7d9745a2780051a749',
    client_secret: '7af200e20068414c897fa4c223e4f6ae',
    accessToken: null, // 视频活体token
    tokenType: null, // 视频活体token类型
    sessionId: null, // 视频活体会话ID
    publicKey: null, // 视频活体公钥
  },
  getters: {
  },
  mutations: {
    updateToken(state, accessToken) {
      state.accessToken = accessToken
    },
    updateTokenType(state, tokenType) {
      state.tokenType = tokenType
    },
    updateSessionId(state, sessionId) {
      state.sessionId = sessionId
    },
    updatePublicKey(state, publicKey) {
      state.publicKey = publicKey
    }
  },
  actions: {
  },
  modules: {
  }
})
