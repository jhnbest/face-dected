import axios from 'axios';
import { generateSM3Sign } from './crypto';
import store from '@/store';

const SECRET_KEY = store.state.client_secret;

// axios.defaults.baseURL = '/api';

// 请求拦截器
axios.interceptors.request.use(config => {
  const { sign, timestamp, nonce } = generateSM3Sign(
    store.state.accessToken,
    SECRET_KEY
  );

  const authorization = 'Bearer ' + store.state.accessToken;

  // // 1. 解析URL并创建查询参数对象
  // const url = new URL(config.url, window.location.origin);

  // // 2. 添加四个参数到URL查询字符串
  // url.searchParams.append('Authorization', authorization);
  // url.searchParams.append('timestamp', timestamp);
  // url.searchParams.append('nonce', nonce);
  // url.searchParams.append('sign', sign);

  // // 3. 更新config.url为新的带参数URL
  // config.url = url.href;

  config.params = {
    ...config.params,
    Authorization: authorization,
    timestamp: timestamp,
    nonce: nonce,
    sign: sign
  };

  config.headers['Content-Type'] = 'application/json'
  config.headers['Authorization'] = 'Bearer' + ' ' + store.state.accessToken
  config.headers['timestamp'] = timestamp
  config.headers['nonce'] = nonce
  config.headers['sign'] = sign

  config.data = JSON.stringify(config.data)

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
        resolve(response)
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