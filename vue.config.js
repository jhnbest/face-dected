const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    proxy: {
      // '/sso': {
      //   target: 'https://mix.cloudwalk.com',
      //   changeOrigin: true,
      //   secure: false
      // },
      '/': {
        target: 'https://mix.cloudwalk.com',
        changeOrigin: true,
        secure: false,
        ws: false
      }
    }
  }
})
