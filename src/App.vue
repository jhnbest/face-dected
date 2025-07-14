<template>
  <div id="app">
    <!-- 加载遮罩层：系统初始化或加载时显示 -->
    <div v-if="isLoading" class="connecting-overlay">
      <div class="spinner"></div>
      <h2>{{ loadingMessage }}</h2>
    </div>

    <!-- 摄像头选择下拉框：当检测到多个摄像头时显示 -->
    <div v-if="!isLoading && cameras.length > 1" class="camera-selector">
      <label for="camera-select">选择摄像头：</label>
      <select id="camera-select" v-model="selectedCameraId" @change="onCameraChange">
        <option v-for="camera in cameras" :key="camera.deviceId" :value="camera.deviceId">
          {{ camera.label || `摄像头 ${camera.deviceId.substring(0, 8)}` }} <!-- 显示摄像头标签或设备ID前缀 -->
        </option>
      </select>
    </div>

    <!-- 通知系统：用于显示操作结果提示 -->
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
      <!-- 摄像头控制面板：显示摄像头状态和控制按钮 -->
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

      <!-- 抓拍结果面板：显示抓拍的人脸图像和视频片段 -->
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
    <!-- 隐藏的画布元素：用于人脸图像裁剪 -->
    <canvas id="canvas" style="display: none"></canvas>

    <!-- 控制台日志面板 -->
    <div class="console-panel" :class="{ expanded: consoleExpanded }">
      <div class="console-header" @click="toggleConsole">
        <i class="fas fa-terminal"></i>
        <span>控制台日志</span>
        <i :class="consoleExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </div>
      <div class="console-body" v-if="consoleExpanded">
        <div class="console-controls">
          <button @click="clearConsole" class="btn-sm">清空</button>
          <span class="log-count">{{ consoleLogs.length }} 条日志</span>
        </div>
        <div class="console-content">
          <div v-for="(log, index) in consoleLogs" :key="index" class="log-item">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 导入组件
import CameraPanel from './components/CameraPanel.vue'
import CapturePanel from './components/CapturePanel.vue'

// 导入工具函数和类
import { createDetector, detectFacesV2 } from './utils/detectionV2'
import {STATE} from './utils/shared/params'
import {Camera} from './utils/camera'

export default {
  components: {
    CameraPanel,  // 摄像头控制面板组件
    CapturePanel  // 抓拍结果面板组件
  },
  data() {
    return {
      lastFrameTime: null,          // 上一帧渲染时间（用于控制帧率）
      lastCaptureTime: null,        // 上一次抓拍时间（用于控制抓拍频率）
      isLoading: true,              // 是否显示加载状态
      loadingMessage: '正在初始化系统...', // 加载状态提示信息
      cameraActive: true,           // 摄像头是否激活
      modelLoaded: false,           // 人脸检测模型是否加载完成
      modelObj: null,               // 人脸检测模型实例
      stream: null,                 // 摄像头媒体流对象
      isAutoCaptureEnabled: false,  // 是否启用自动抓拍
      detectionInterval: null,      // 检测定时器（旧实现，已改用requestAnimationFrame）
      captures: [],                 // 抓拍的人脸图像列表
      faceCount: 0,                 // 检测到的人脸数量
      distanceValue: "距离较远",     // 人脸距离描述文字
      distancePercentage: 0,        // 人脸距离百分比（0-100）
      fps: 0,                       // 当前帧率
      lastDetectionTime: 0,         // 上一次检测时间
      frameCount: 0,                // 帧计数器
      modelStatus: "未加载",         // 模型状态描述
      cameraStatus: "未连接",        // 摄像头状态描述
      processingInfo: "正在初始化系统...", // 处理状态信息
      showNotificationFlag: false,  // 是否显示通知
      notificationMessage: "",      // 通知消息内容
      statusMessages: [             // 状态提示消息列表
        "监控中: 系统正在检测人脸",
        "监控中: 等待靠近的人脸",
        "监控中: 实时分析中",
        "监控中: 一切正常"
      ],
      camera: null,                 // 摄像头实例
      rafId: null,                  // requestAnimationFrame ID
      lastTime: 0,                  // 上一次时间戳
      videoClips: [],               // 录制的视频片段列表
      mediaRecorder: null,          // 媒体录制器实例
      recordedChunks: [],           // 录制的媒体数据块
      maxClips: 6,                  // 最大视频片段数量
      isConvertBase64Finish: true,  // Base64转换是否完成
      timestamp1: null,             // 调试用时间戳1
      timestamp2: null,             // 调试用时间戳2
      timestamp3: null,             // 调试用时间戳3
      timestamp4: null,             // 调试用时间戳4
      cameras: [],                  // 可用摄像头列表
      selectedCameraId: '',         // 当前选中的摄像头ID
      cameraChanging: false,         // 摄像头切换中标志
      consoleLogs: [],        // 存储控制台日志
      consoleExpanded: false, // 控制日志面板展开/折叠
      maxLogCount: 50         // 最大日志数量
    }
  },
  computed: {
    // 计算属性：获取抓拍数量
    captureCount() {
      return this.captures.length;
    }
  },
  methods: {
    /**
     * 显示通知消息
     * @param {string} message - 通知内容
     * @param {number} duration - 显示时长(毫秒)，默认3000ms
     */
    showNotification(message, duration = 3000) {
      this.notificationMessage = message;
      this.showNotificationFlag = true;
      setTimeout(() => {
        this.showNotificationFlag = false;
      }, duration);
    },

    /**
     * 更新处理状态信息
     * @param {string} message - 状态信息内容
     */
    updateProcessingInfo(message) {
      this.processingInfo = message;
    },

    /**
     * 更新模型状态
     * @param {string} message - 模型状态信息
     */
    updateModelStatus(message) {
      this.modelStatus = message;
    },

    /**
     * 更新摄像头状态
     * @param {string} message - 摄像头状态信息
     */
    updateCameraStatus(message) {
      this.cameraStatus = message;
    },

    /**
     * 运行自动检测（主循环）
     * 使用requestAnimationFrame控制帧率，每40ms渲染一帧(25fps)
     * @param {number} timestamp - 时间戳
     */
    async runAutoDetection(timestamp) {
      // 控制帧率：确保至少40ms才处理一帧（25fps）
      if (!this.lastFrameTime || timestamp - this.lastFrameTime >= 40) {
        this.lastFrameTime = timestamp;

        let faces = null
        // 如果模型已加载，则进行人脸检测
        if (this.modelObj !== null) {
          this.modelLoaded = true
          faces = await detectFacesV2(this.modelObj, this.camera)
        }

        // 绘制摄像头画面到画布
        this.camera.drawCtx();

        // 如果检测到人脸，绘制人脸框
        if (faces && faces.length > 0) {
          this.camera.drawResults(faces, true, true);
        }

        // 计算并更新帧率
        const delta = timestamp - this.lastTime;
        this.fps = Math.round(1000 / delta);
        this.lastTime = timestamp;

        // 如果检测到人脸，进行距离判断和抓拍
        if (faces && faces.length > 0) {
          const face = faces[0].box;
          const { distancePercentage } = this.calculateFaceDistance(face);

          // 如果人脸距离足够近（>80%），且距离上次抓拍超过2秒，则开始录制视频
          if (distancePercentage > 80) {
            if (!this.lastCaptureTime || timestamp - this.lastCaptureTime >= 2000) {
              this.lastCaptureTime = timestamp
              // this.captureFace(face);
              this.startRecording()
            }
          }
        }
      }

      // 继续请求下一帧
      this.rafId = window.requestAnimationFrame(this.runAutoDetection) ||
          window.webkitRequestAnimationFrame(this.runAutoDetection) ||
          window.mozRequestAnimationFrame(this.runAutoDetection)
    },

    /**
     * 计算人脸距离
     * 根据人脸高度占视频高度的比例估算距离
     * @param {Object} face - 人脸检测结果对象
     * @returns {Object} 包含距离百分比和距离等级的对象
     */
    calculateFaceDistance(face) {
      const video = document.getElementById('video');
      if (!video || !video.videoHeight) {
        return { distancePercentage: 0, distanceLevel: "无法检测" };
      }

      // 获取人脸边界框坐标和视频高度
      const videoHeight = video.videoHeight;
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

    /**
     * 抓拍人脸图像
     * @param {Object} face - 人脸检测结果对象
     */
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

    /**
     * 切换自动抓拍模式
     * 启用/禁用自动检测和抓拍功能
     */
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

    /**
     * 手动抓拍人脸（未使用）
     */
    async captureFaceManual() {
      // 预留的手动抓拍功能
    },

    /**
     * 清空所有抓拍照片
     */
    clearCaptures() {
      this.captures = [];
      this.showNotification('已清空所有照片');
    },

    /**
     * 更新状态消息（未使用）
     */
    updateStatusMessage() {
      if (this.isAutoCaptureEnabled) {
        const randomIndex = Math.floor(Math.random() * this.statusMessages.length);
        this.updateProcessingInfo(this.statusMessages[randomIndex]);
      }
    },

    /**
     * 初始化应用
     * 依次检测摄像头、初始化摄像头、加载模型
     */
    async initializeApp() {
      try {
        this.updateProcessingInfo('正在检测可用摄像头...');
        const hasCameras = await this.getAvailableCameras();
        if (!hasCameras) {
          this.showNotification('未检测到摄像头设备');
          this.updateProcessingInfo('未检测到摄像头设备');
          this.isLoading = false;
          return;
        }

        this.updateProcessingInfo('正在初始化摄像头...');
        STATE.camera.deviceId = this.selectedCameraId;
        this.camera = await Camera.setupCamera(STATE.camera);

        if (this.camera !== null) {
          this.cameraActive = true;
          this.updateCameraStatus('已连接');
        }

        // 加载模型v2
        this.updateProcessingInfo('正在加载检测模型...');
        this.modelObj = await createDetector(
          status => this.updateModelStatus(status),
          message => {
            this.loadingMessage = message;
            this.updateProcessingInfo(message);
          }
        )

        this.isLoading = false;

        if (this.camera !== null && this.modelObj !== null) {
          this.showNotification('系统就绪！点击"开始自动抓拍"按钮');
        }

      } catch (error) {
        console.error('初始化失败:', error);
        this.showNotification('系统初始化失败，请刷新页面重试');
        this.isLoading = false;
      }
    },

    /**
     * 开始录制视频
     * 当检测到人脸时触发，录制2秒视频
     */
    startRecording() {
      // 如果Base64转换未完成，则不开始新的录制
      if (!this.isConvertBase64Finish) return
      this.isConvertBase64Finish = false
      console.log("----------------------startRecording!----------------")
      this.timestamp1 = Date.now()
      this.recordedChunks = [];
      const stream = document.getElementById('video').srcObject;
      // 创建媒体录制器实例
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=h264',
        videoBitsPerSecond: 1000000 // 2.5Mbps比特率
      });

      // 数据可用时的回调
      this.mediaRecorder.ondataavailable = e => {
        console.log("----------------------ondataavailable----------------")
        this.timestamp2 = Date.now()
        console.log('录制2s耗时')
        console.log(this.timestamp2 - this.timestamp1)
        if (e.data.size > 0) this.recordedChunks.push(e.data);
        this.convertToBase64();
      };

      // 开始录制
      this.mediaRecorder.start();

      // 2秒后停止录制
      setTimeout(() => {
        this.mediaRecorder.stop();
      }, 2000);

    },

    /**
     * 将录制的视频转换为Base64格式
     * 并添加到视频片段列表中
     */
    async convertToBase64() {
      // 创建Blob对象
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
      // 转换完成回调
      reader.onloadend = () => {
        // 将新视频添加到列表开头
        this.videoClips.unshift({
          id: Date.now(),
          src: reader.result,
          playing: false
        });
        // 如果超过最大数量，移除最旧的视频
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
    },

    /**
     * 获取可用摄像头列表
     * @returns {boolean} 是否成功获取摄像头列表
     */
    async getAvailableCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.cameras = devices.filter(device => device.kind === 'videoinput');

        if (this.cameras.length > 0) {
          this.selectedCameraId = this.cameras[0].deviceId;
          return true;
        }
        return false;
      } catch (error) {
        console.error('获取摄像头列表失败:', error);
        this.showNotification('获取摄像头列表失败');
        return false;
      }
    },

    /**
     * 摄像头切换处理
     * 停止当前摄像头，使用选中的摄像头重新初始化
     */
    async onCameraChange() {
      if (this.cameraChanging) return;
      this.cameraChanging = true;
      this.showNotification('正在切换摄像头...');

      try {
        // 停止当前摄像头
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }

        // 停止自动检测
        if (this.isAutoCaptureEnabled) {
          cancelAnimationFrame(this.rafId);
        }

        // 使用选中的摄像头重新初始化
        STATE.camera.deviceId = this.selectedCameraId;
        this.camera = await Camera.setupCamera(STATE.camera);

        // 重新开始自动检测
        if (this.isAutoCaptureEnabled) {
          this.runAutoDetection();
        }

        this.showNotification('摄像头切换成功');
      } catch (error) {
        console.error('切换摄像头失败:', error);
        this.showNotification('切换摄像头失败，请重试');
      } finally {
        this.cameraChanging = false;
      }
    },
    /**
     * 切换控制台日志面板显示状态
     */
    toggleConsole() {
      this.consoleExpanded = !this.consoleExpanded;
    },

    /**
     * 清空控制台日志
     */
    clearConsole() {
      this.consoleLogs = [];
    },

    /**
     * 添加日志到控制台面板
     * @param {string} message - 日志消息
     */
    addConsoleLog(message) {
      const time = new Date().toLocaleTimeString();
      this.consoleLogs.push({ time, message });

      // 保持日志数量不超过最大值
      if (this.consoleLogs.length > this.maxLogCount) {
        this.consoleLogs.shift();
      }
    }
  },
  /**
   * 组件挂载后初始化应用
   */
  async mounted() {
    await this.initializeApp();

    // 重写console.log方法以捕获日志
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      // 调用原始console.log
      originalConsoleLog.apply(console, args);

      // 将日志添加到面板
      try {
        // 格式化日志消息
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            return JSON.stringify(arg, null, 2);
          }
          return String(arg);
        }).join(' ');

        this.addConsoleLog(message);
      } catch (e) {
        this.addConsoleLog('日志格式化失败: ' + e.message);
      }
    };
  },
  /**
   * 组件销毁前清理资源
   */
  beforeDestroy() {
    // 清理摄像头流
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    // 清理定时器
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }
}
</script>

<style>
/* ... 现有样式 ... */

/* 摄像头选择器样式 */
.camera-selector {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
}

.camera-selector select {
  margin-left: 10px;
  padding: 5px;
  border-radius: 3px;
  border: none;
}

/* 控制台日志面板样式 */
.console-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  z-index: 1000;
  color: #fff;
  font-family: monospace;
  font-size: 12px;
}

.console-header {
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.console-body {
  max-height: 300px;
  overflow: hidden;
}

.console-controls {
  padding: 8px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.console-content {
  padding: 10px 15px;
  max-height: 250px;
  overflow-y: auto;
}

.log-item {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(255,255,255,0.05);
}

.log-time {
  color: #64dd17;
  margin-right: 8px;
}

.log-message {
  word-break: break-all;
}

.btn-sm {
  padding: 3px 8px;
  font-size: 11px;
  border-radius: 3px;
  background: #444;
  color: white;
  border: none;
  cursor: pointer;
}

.log-count {
  color: #aaa;
  font-size: 11px;
}
</style>