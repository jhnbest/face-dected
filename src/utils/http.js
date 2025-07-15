export const httpRequest = async (url, { 
  method = 'POST',
  headers = {},
  body = null 
} = {}) => {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : null
    });

    if (!response.ok) throw new Error(`HTTP错误! 状态码: ${response.status}`);
    
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
};