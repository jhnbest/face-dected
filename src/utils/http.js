import axios from 'axios';
import { generateSM3Sign } from './crypto';
import store from '@/store';

const SECRET_KEY = store.state.client_secret;

// 请求拦截器
axios.interceptors.request.use(config => {
  const { sign, timestamp, nonce } = generateSM3Sign(
    store.state.accessToken,
    SECRET_KEY
  );
  console.log('store.state.accessToken')
  console.log(store.state.accessToken)

  config.headers['Content-Type'] = 'application/json'
  config.headers['token'] = store.state.tokenType + ' ' + store.state.accessToken
  config.headers['timestamp'] = timestamp
  config.headers['nonce'] = nonce
  config.headers['sign'] = sign

  config.data = JSON.stringify(config.data)

  console.log('config')
  console.log(config)

  return config;
});

// 响应拦截器
axios.interceptors.response.use(
  response => response.data,
  error => {
    console.error('请求失败:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export function http (url, params, responseType) {
  return new Promise((resolve, reject) => {
    if (!responseType || typeof (responseType) == 'undefined') {
      // 普通post请求
      axios.post(url, params)
      .then(response => {
        resolve(response.data)
      }, err => {
        reject(err)
      })
    } else {
      // 导出下载文件
      axios.post(url, params, {
        responseType: responseType
      })
      .then(response => {
        resolve(response)
      }, err => {
        reject(err)
      })
    }
  })
}