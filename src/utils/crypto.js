import { sm3 } from 'sm-crypto';

/**
 * 生成SM3签名
 * @param {string} accessToken - 身份令牌
 * @param {string} secretKey - 客户端秘钥
 * @returns {Object} 包含timestamp, nonce, sign的签名对象
 */
export function generateSM3Sign(accessToken, secretKey) {
  // 生成时间戳（毫秒级）
  const timestamp = Date.now();
  
  // 生成32位随机字符串（模拟UUID去除横线）
  const nonce = Math.random().toString(36).substring(2, 10) + 
                Math.random().toString(36).substring(2, 10) + 
                Math.random().toString(36).substring(2, 10) + 
                Math.random().toString(36).substring(2, 10);
  
  // 拼接待加密字符串
  const signStr = `${timestamp}${nonce}${accessToken}${secretKey}`;
  
  // SM3加密并转为16进制字符串
  const sign = sm3(signStr);
  
  return {
    sign,
    timestamp,
    nonce
  };
}