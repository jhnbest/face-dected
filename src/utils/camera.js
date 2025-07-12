/**
 * 初始化摄像头
 * @param {Function} updateStatus 更新状态的回调函数
 * @param {Function} updateMessage 更新消息的回调函数
 * @returns {Promise<Object>} 初始化结果
 */
 export async function initCamera(updateStatus, updateMessage) {
  try {
    updateMessage("正在初始化摄像头...");
    updateStatus("加载中");

    // 检查浏览器是否支持媒体设备
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("您的浏览器不支持摄像头访问");
    }

    // // 获取摄像头权限
    // const stream = await navigator.mediaDevices.getUserMedia({ 
    //   video: {
    //     facingMode: 'user',
    //     width: { ideal: 1280 },
    //     height: { ideal: 720 }
    //   }
    // });
    // 获取摄像头权限
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: 640,
        height: 480,
        frameRate: {
          ideal: 60,
        }
      }
    });

    const videoElement = document.getElementById('video');
    if (videoElement) {
      videoElement.srcObject = stream;
    }

    updateStatus("已连接");
    updateMessage("摄像头初始化成功");

    return {
      success: true,
      stream
    };
  } catch (err) {
    console.error("摄像头访问失败:", err);
    updateStatus(`错误: ${err.message}`);
    updateMessage(`无法访问摄像头: ${err.message}`);
    
    return {
      success: false,
      error: err
    };
  }
}

import {VIDEO_SIZE} from './shared/params';
import {drawResults, isMobile} from './shared/util';

export class Camera {
  constructor() {
    this.video = document.getElementById('video')
    this.canvas = document.getElementById('output')
    this.ctx = this.canvas.getContext('2d')
  }

  /**
   * Initiate a Camera instance and wait for the camera stream to be ready.
   * @param cameraParam From app `STATE.camera`.
   */
  static async setupCamera(cameraParam) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
          'Browser API navigator.mediaDevices.getUserMedia not available');
    }

    const {targetFPS, sizeOption} = cameraParam;
    const $size = VIDEO_SIZE[sizeOption];
    const videoConfig = {
      'audio': false,
      'video': {
        facingMode: 'user',
        // Only setting the video to a specified size for large screen, on
        // mobile devices accept the default size.
        width: 640,
        height: 480,
        frameRate: {
          ideal: 60,
        },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(videoConfig);

    const camera = new Camera();
    camera.video.srcObject = stream;

    await new Promise((resolve) => {
      camera.video.onloadedmetadata = () => {
        resolve(video);
      };
    });

    camera.video.play();

    const videoWidth = camera.video.videoWidth
    const videoHeight = camera.video.videoHeight
    // Must set below two lines, otherwise video element doesn't show.
    camera.video.width = videoWidth
    camera.video.height = videoHeight

    camera.canvas.width = videoWidth;
    camera.canvas.height = videoHeight
    const canvasContainer = document.querySelector('.canvas-wrapper')
    canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`

    // Because the image from camera is mirrored, need to flip horizontally.
    camera.ctx.translate(camera.video.videoWidth, 0)
    camera.ctx.scale(-1, 1)

    return camera;
  }

  drawCtx() {
    console.log('this.video.videoWidth')
    console.log(this.video.videoWidth)
    console.log('this.video.videoHeight')
    console.log(this.video.videoHeight)
    this.ctx.drawImage(
        this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
  }

  drawResults(faces, boundingBox, keypoints) {
    console.log('boundingBox')
    console.log(boundingBox)
    console.log('keypoints')
    console.log(keypoints)
    console.log('this.ctx')
    console.log(this.ctx)
    drawResults(this.ctx, faces, boundingBox, keypoints);
  }
}