<script setup>
import { ref } from 'vue'
import TextureLoader from './TextureLoader.vue'

defineProps({
  textureUrls: { type: Array, default: () => [] },
})
const emit = defineEmits(['ready'])
const canvas = ref(null)

defineExpose({ canvas })
</script>

<template>
  <div class="game-root">
    <canvas ref="canvas" />
    <TextureLoader :texture-urls="textureUrls" @loaded="emit('ready', $event)" />
  </div>
</template>

<style scoped>
.game-root {
  position: relative;
  width: 100%;
  height: 100dvh;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #f7faf8;
  touch-action: none;
  user-select: none;
}

canvas {
  display: block;
  grid-area: 1 / 1;
}
</style>
