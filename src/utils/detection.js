import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from'@tensorflow/tfjs-backend-webgl';

/**
 * 加载人脸检测模型
 * @param {Function} updateStatus 更新状态的回调函数
 * @param {Function} updateMessage 更新消息的回调函数
 * @returns {Promise<Object>} 加载结果
 */
export async function loadModel(updateStatus, updateMessage) {
  try {
    updateMessage("正在加载人脸检测模型...");
    updateStatus("加载中");
    
    // 设置TensorFlow.js后端为WebGL
    await tf.setBackend('webgl');
    
    // 加载Blazeface模型
    const model = await blazeface.load({
      maxFaces: 1,
      inputResolution: { width: 640, height: 480 }
    });
    
    updateStatus("已加载");
    updateMessage("人脸检测模型加载成功");
    
    return {
      success: true,
      model
    };
  } catch (err) {
    console.error("模型加载失败:", err);
    updateStatus("加载失败");
    updateMessage(`无法加载模型: ${err.message}`);
    
    return {
      success: false,
      error: err
    };
  }
}

/**
 * 检测人脸
 * @param {Object} model 人脸检测模型
 * @returns {Promise<Array>} 检测到的人脸数组
 */
export async function detectFaces(model) {
  const videoElement = document.getElementById('video');
  
  if (!model || !videoElement || !videoElement.videoWidth) {
    return null;
  }
  
  try {
    // 使用模型检测人脸
    const predictions = await model.estimateFaces(
      videoElement, 
      true // 返回裁剪后的人脸图片
    );
    
    return predictions;
  } catch (err) {
    console.error("人脸检测失败:", err);
    return null;
  }
}