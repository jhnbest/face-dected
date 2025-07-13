<template>
  <div class="panel">
    <h2 class="panel-title"><i class="fas fa-chart-line"></i> 检测状态</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <i class="fas fa-user-check fa-2x"></i>
        <div class="stat-value">{{ faceCount }}</div>
        <div class="stat-label">检测到人脸</div>
      </div>
      <div class="stat-card">
        <i class="fas fa-image fa-2x"></i>
        <div class="stat-value">{{ captureCount }}</div>
        <div class="stat-label">已抓拍照片</div>
      </div>
      <div class="stat-card">
        <i class="fas fa-arrows-alt-v fa-2x"></i>
        <div class="stat-value">{{ distanceValue }}</div>
        <div class="stat-label">人脸距离</div>
      </div>
      <div class="stat-card">
        <i class="fas fa-stopwatch fa-2x"></i>
        <div class="stat-value">{{ fps }}</div>
        <div class="stat-label">检测速度 (FPS)</div>
      </div>
    </div>
    
    <h3 style="margin-top: 25px; color: #4fc3f7;">人脸距离指示器</h3>
    <div class="distance-indicator">
      <div class="distance-fill" :style="{ width: distancePercentage + '%' }"></div>
    </div>
    
    <h2 class="panel-title" style="margin-top: 40px;">
      <i class="fas fa-images"></i> 抓拍结果
    </h2>
    <!-- <div v-if="captures.length > 0" class="capture-grid">
      <div v-for="capture in displayCaptures" :key="capture.id" class="capture-card">
        <img :src="capture.img" alt="抓拍的人脸" class="capture-img">
        <div class="capture-meta">
          <span>{{ capture.timestamp }}</span>
          <span>{{ capture.distance }}</span>
        </div>
      </div>
    </div> -->
    <div v-if="clips.length > 0" class="capture-grid">
      <div v-for="captureVideo in clips" :key="captureVideo.id" class="capture-card">
        <video :src="captureVideo.src" alt="抓拍的人脸" class="capture-img" controls></video>
        <!-- <div class="capture-meta">
          <span>{{ capture.timestamp }}</span>
          <span>{{ capture.distance }}</span>
        </div> -->
      </div>
    </div>
    <div v-else class="no-captures">
      <p>暂无抓拍结果</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    captures: Array,
    clips: Array,
    faceCount: Number,
    distanceValue: String,
    distancePercentage: Number,
    fps: Number
  },
  data() {
    return {
      videoURL: null
    }
  },
  computed: {
    displayCaptures() {
      return [...this.captures].reverse().slice(0, 6);
    },
    captureCount() {
      return this.captures.length;
    }
  }
}
</script>

<style scoped>
.no-captures {
  padding: 20px; 
  text-align: center;
  color: #aaa;
}
/* .capture-img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
} */

/* 网格布局优化 */
.capture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
</style>