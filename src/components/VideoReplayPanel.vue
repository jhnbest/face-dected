<template>
  <div class="video-replay">
    <div v-for="clip in clips" :key="clip.id" class="video-item">
      <video 
        ref="videoPlayer"
        :src="clip.src" 
        @click="togglePlay(clip)"
        :class="{ playing: clip.playing }">
      </video>
      <button @click="togglePlay(clip)">
        {{ clip.playing ? '⏸️' : '▶️' }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: ['clips'],
  methods: {
    togglePlay(clip) {
      const video = this.$refs.videoPlayer.find(v => v.src === clip.src);
      clip.playing = !clip.playing;
      clip.playing ? video.play() : video.pause();
    }
  }
}
</script>