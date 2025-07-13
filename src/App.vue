<template>
  <div id="app">
    <!-- 加载遮罩 -->
    <div v-if="isLoading" class="connecting-overlay">
      <div class="spinner"></div>
      <h2>{{ loadingMessage }}</h2>
    </div>

    <!-- 通知系统 -->
    <transition name="notification">
      <div v-if="showNotificationFlag" class="notification" @click="showNotification = false">
        {{ notificationMessage }}
      </div>
    </transition>

    <header>
      <h1><i class="fas fa-camera"></i> 人脸抓拍系统</h1>
      <p class="subtitle">基于FaceDected模型自动检测并抓拍</p>
    </header>

    <div class="panel-container">
      <CameraPanel
        :camera-active="cameraActive"
        :model-loaded="modelLoaded"
        :is-auto-capture-enabled="isAutoCaptureEnabled"
        :model-status="modelStatus"
        :camera-status="cameraStatus"
        :processing-info="processingInfo"
        @toggle-auto-capture="toggleAutoCapture"
        @capture-face="captureFace"
        @clear-captures="clearCaptures"
      />

      <CapturePanel
        :captures="captures"
        :face-count="faceCount"
        :distance-value="distanceValue"
        :distance-percentage="distancePercentage"
        :fps="fps"
        :clips="videoClips"
      />
    </div>

    <div class="footer">
      <p>人脸抓拍系统</p>
    </div>
    <canvas id="canvas" style="display: none"></canvas>
  </div>
</template>

<script>

import CameraPanel from './components/CameraPanel.vue'
import CapturePanel from './components/CapturePanel.vue'

import { createDetector, detectFacesV2 } from './utils/detectionV2'
import {STATE} from './utils/shared/params'
import {Camera} from './utils/camera'

export default {
  components: {
    CameraPanel,
    CapturePanel
  },
  data() {
    return {
      lastFrameTime: null,
      lastCaptureTime: null,
      isLoading: true,
      loadingMessage: '正在初始化系统...',
      cameraActive: true,
      modelLoaded: false,
      modelObj: null,
      stream: null,
      isAutoCaptureEnabled: false,
      detectionInterval: null,
      captures: [],
      faceCount: 0,
      distanceValue: "距离较远",
      distancePercentage: 0,
      fps: 0,
      lastDetectionTime: 0,
      frameCount: 0,
      modelStatus: "未加载",
      cameraStatus: "未连接",
      processingInfo: "正在初始化系统...",
      showNotificationFlag: false,
      notificationMessage: "",
      statusMessages: [
        "监控中: 系统正在检测人脸",
        "监控中: 等待靠近的人脸",
        "监控中: 实时分析中",
        "监控中: 一切正常"
      ],
      camera: null,
      rafId: null,
      lastTime: 0,
      videoClips: [],
      mediaRecorder: null,
      recordedChunks: [],
      maxClips: 6,
      isConvertBase64Finish: true,
      timestamp1: null,
      timestamp2: null,
      timestamp3: null,
      timestamp4: null,
    }
  },
  computed: {
    captureCount() {
      return this.captures.length;
    }
  },
  methods: {
    showNotification(message, duration = 3000) {
      this.notificationMessage = message;
      this.showNotificationFlag = true;
      setTimeout(() => {
        this.showNotificationFlag = false;
      }, duration);
    },
    updateProcessingInfo(message) {
      this.processingInfo = message;
    },
    updateModelStatus(message) {
      this.modelStatus = message;
    },
    updateCameraStatus(message) {
      this.cameraStatus = message;
    },
    async runAutoDetection(timestamp) {
      if (!this.lastFrameTime || timestamp - this.lastFrameTime >= 40) { // 40ms = 25fps
        this.lastFrameTime = timestamp;

        let faces = null
        if (this.modelObj !== null) {
          this.modelLoaded = true
          faces = await detectFacesV2(this.modelObj, this.camera)
        }

        this.camera.drawCtx();

        // The null check makes sure the UI is not in the middle of changing to a
        // different model. If during model change, the result is from an old model,
        // which shouldn't be rendered.
        if (faces && faces.length > 0) {
          this.camera.drawResults(faces, true, true);
        }
        const delta = timestamp - this.lastTime;
        this.fps = Math.round(1000 / delta);

        this.lastTime = timestamp;

        if (faces && faces.length > 0) {
          const face = faces[0].box;
          const { distancePercentage } = this.calculateFaceDistance(face);

          // 如果非常靠近（距离百分比>70），则抓拍
          if (distancePercentage > 80) {
            if (!this.lastCaptureTime || timestamp - this.lastCaptureTime >= 1000) {
              this.lastCaptureTime = timestamp
              // this.captureFace(face);
              this.startRecording()
            }
          }
        }
      }

      this.rafId = window.requestAnimationFrame(this.runAutoDetection) ||
          window.webkitRequestAnimationFrame(this.runAutoDetection) ||
          window.mozRequestAnimationFrame(this.runAutoDetection)
    },
    calculateFaceDistance(face) {
      const video = document.getElementById('video');
      if (!video || !video.videoHeight) {
        return { distancePercentage: 0, distanceLevel: "无法检测" };
      }

      // 获取人脸边界框坐标
      const videoHeight = video.videoHeight;
      // 计算人脸在视频上的像素高度
      const faceHeight = face.height
      
      // 计算人脸高度占视频高度的百分比
      const faceHeightRatio = faceHeight / videoHeight;
      
      // 距离指示器（0-100%），人脸越大表示距离越近
      const distancePercentage = Math.min(100, Math.max(0, faceHeightRatio * 150));
      this.distancePercentage = distancePercentage;
      
      // 更新UI中的距离值
      let distanceLevel;
      if (distancePercentage > 70) distanceLevel = "非常靠近";
      else if (distancePercentage > 40) distanceLevel = "中等距离";
      else distanceLevel = "距离较远";
      
      this.distanceValue = distanceLevel;
      return { distancePercentage, distanceLevel };
    },
    captureFace(face) {
      const video = document.getElementById('video');
      const canvas = document.getElementById('canvas');

      if (!face || !video || !video.videoWidth || !canvas) return;

      const ctx = canvas.getContext('2d');

      // 设置画布尺寸与视频一致
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 计算裁剪区域
      const width = face.width;
      const height = face.height;

      // 扩展检测框范围 (20%)
      const xscale = 0.2;
      const yscale = 0.1;
      const scaledWidth = width * (1 + xscale * 2);
      const scaledHeight = height * (1 + yscale * 2);
      const scaledX = Math.max(0, face.xMin - width * xscale);
      const scaledY = Math.max(0, face.yMin - height * yscale);

      // 创建临时Canvas裁剪人脸
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = scaledWidth;
      tempCanvas.height = scaledHeight;

      // 从主画布中复制人脸区域
      tempCtx.drawImage(
        canvas,
        scaledX, scaledY, scaledWidth, scaledHeight,
        0, 0, scaledWidth, scaledHeight
      );

      // 创建图像数据URL
      const dataURL = tempCanvas.toDataURL('image/jpeg', 1);

      // 保存抓拍信息
      this.captures.push({
        id: Date.now(),
        img: dataURL,
        timestamp: new Date().toLocaleString(),
        distance: this.distanceValue
      });

      this.showNotification('人脸抓拍成功！');
    },
    toggleAutoCapture() {
      // 原定时器写法
      // if (!this.isAutoCaptureEnabled) {
      //   this.isAutoCaptureEnabled = true;
      //   // 每500ms执行一次检测
      //   this.detectionInterval = setInterval(this.runAutoDetection, 500);
      //   this.updateProcessingInfo("自动抓拍模式已启动...");
      // } else {
      //   this.isAutoCaptureEnabled = false;
      //   // 停止检测
      //   clearInterval(this.detectionInterval);
      //   this.updateProcessingInfo("自动抓拍模式已停止");
      // }

      if (!this.isAutoCaptureEnabled) {
        this.isAutoCaptureEnabled = true;
        this.runAutoDetection()
        this.updateProcessingInfo("自动抓拍模式已启动...")
      } else {
        this.isAutoCaptureEnabled = false;
        // 停止检测
        cancelAnimationFrame(this.rafId)
        this.updateProcessingInfo("自动抓拍模式已停止");
      }
    },
    async captureFaceManual() {
      // if (!this.modelObj) {
      //   this.showNotification('模型未加载完成！');
      //   return;
      // }
      // // 手动触发抓拍
      // const faces = await detectFaces(this.modelObj);
      // if (faces && faces.length > 0) {
      //   this.captureFace(faces[0]);
      // } else {
      //   this.showNotification('未检测到人脸！');
      // }

      // const faces = await detectFaces(this.modelObj);
    },
    clearCaptures() {
      this.captures = [];
      this.showNotification('已清空所有照片');
    },
    updateStatusMessage() {
      if (this.isAutoCaptureEnabled) {
        const randomIndex = Math.floor(Math.random() * this.statusMessages.length);
        this.updateProcessingInfo(this.statusMessages[randomIndex]);
      }
    },
    async initializeApp() {
      try {
        this.camera = await Camera.setupCamera(STATE.camera);

        if (this.camera !== null) {
          this.cameraActive = true;
        }

        // 加载模型v2
        this.modelObj = await createDetector(
          status => this.updateModelStatus(status),
          message => {
            this.loadingMessage = message;
            this.updateProcessingInfo(message);
          }
        )

        this.isLoading = false;

        if (this.camera !== null) {
          this.showNotification('系统就绪！点击"开始自动抓拍"按钮');
        }

        // 设置每3秒更新一次状态信息
        // this.statusInterval = setInterval(this.updateStatusMessage, 1000);
      } catch (error) {
        console.error('初始化失败:', error);
        this.showNotification('系统初始化失败，请刷新页面重试');
      }
    },
    startRecording() {
      if (!this.isConvertBase64Finish) return
      this.isConvertBase64Finish = false
      console.log("----------------------startRecording!----------------")
      this.timestamp1 = Date.now()
      this.recordedChunks = [];
      const stream = document.getElementById('video').srcObject;
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=h264',
        videoBitsPerSecond: 2500000
      });

      this.mediaRecorder.ondataavailable = e => {
        console.log("----------------------ondataavailable----------------")
        this.timestamp2 = Date.now()
        console.log('录制2s耗时')
        console.log(this.timestamp2 - this.timestamp1)
        if (e.data.size > 0) this.recordedChunks.push(e.data);
        this.convertToBase64();
      };

      this.mediaRecorder.start();

      setTimeout(() => {
        this.mediaRecorder.stop();
      }, 2000);

    },

    async convertToBase64() {
      const blob = new Blob(this.recordedChunks, { type: 'video/mp4' });
      if (blob.size === 0) return
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      console.log('this.recordedChunks')
      console.log(this.recordedChunks)
      console.log('blob')
      console.log(blob)
      console.log('reader')
      console.log(reader)
      reader.onloadend = () => {
        this.videoClips.unshift({
          id: Date.now(),
          src: reader.result,
          playing: false
        });
        if (this.videoClips.length > this.maxClips) {
          this.videoClips.pop();
        }
        this.isConvertBase64Finish = true
        this.timestamp3 = Date.now()
        console.log('转换2s耗时')
        console.log(this.timestamp3 - this.timestamp2)
        console.log('this.videoClips')
        console.log(this.videoClips)
        console.log("----------------------convertToBase64 done!----------------")
      };
    }
  },
  async mounted() {
    await this.initializeApp();
  },
  beforeDestroy() {
    // 清理资源
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }
}
</script>