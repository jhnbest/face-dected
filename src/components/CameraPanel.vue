<template>
  <div class="panel">
    <h2 class="panel-title"><i class="fas fa-video"></i> 实时监控画面</h2>
    <div class="canvas-wrapper">
      <video id="video" playsinline style="
        visibility: hidden;
        -webkit-transform: scaleX(-1);
        transform: scaleX(-1);
        width: auto;
        height: auto;
        "></video>
      <canvas id="output"></canvas>
    </div>

    <h2 class="panel-title"><i class="fas fa-sliders-h"></i> 控制面板</h2>
    <div class="controls">
      <button @click="$emit('toggle-auto-capture')" :class="autoCaptureBtnClass">
        <i :class="startBtnIcon"></i> {{ autoCaptureBtnText }}
      </button>
      <button @click="$emit('capture-face')" class="btn btn-success">
        <i class="fas fa-camera"></i> 手动抓拍
      </button>
      <button @click="$emit('clear-captures')" class="btn btn-warning">
        <i class="fas fa-trash-alt"></i> 清空照片
      </button>
    </div>
    
    <div class="status-card">
      <h2 class="panel-title"><i class="fas fa-info-circle"></i> 系统状态</h2>
      <div id="statusInfo">
        <p>
          模型状态: 
          <span :class="modelStatusClass"></span>
          {{ modelStatus }}
        </p>
        <p>
          摄像头状态: 
          <span :class="cameraStatusClass"></span>
          {{ cameraStatus }}
        </p>
        <p class="processing-message">{{ processingInfo }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    cameraActive: Boolean,
    modelLoaded: Boolean,
    isAutoCaptureEnabled: Boolean,
    modelStatus: String,
    cameraStatus: String,
    processingInfo: String
  },
  computed: {
    autoCaptureBtnText() {
      return this.isAutoCaptureEnabled ? "停止自动抓拍" : "开始自动抓拍";
    },
    autoCaptureBtnClass() {
      const base = "btn";
      return this.isAutoCaptureEnabled 
        ? `${base} btn-warning` 
        : `${base} btn-primary`;
    },
    startBtnIcon() {
      return this.isAutoCaptureEnabled ? "fas fa-stop-circle" : "fas fa-play-circle";
    },
    modelStatusClass() {
      return `status-indicator ${
        this.modelStatus.includes("已加载") ? "status-green" :
        this.modelStatus.includes("加载中") ? "status-yellow" : "status-red"
      }`;
    },
    cameraStatusClass() {
      return `status-indicator ${
        this.cameraStatus.includes("已连接") ? "status-green" : "status-red"
      }`;
    }
  }
}
</script>

<style scoped>
.video-placeholder {
  background: #222;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 1.2rem;
}
#canvas-wrapper {
  position: relative;
}
</style>