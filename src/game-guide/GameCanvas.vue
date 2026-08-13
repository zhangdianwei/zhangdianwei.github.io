<script setup>
import { ref } from 'vue'
import TextureLoader from './TextureLoader.vue'

defineProps({
  textures: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['ready'])
const canvas = ref(null)

defineExpose({ canvas })
</script>

<template>
  <div class="game-root">
    <canvas ref="canvas" />
    <TextureLoader :textures="textures" @loaded="emit('ready', $event)" />
  </div>
</template>

<style scoped>
.game-root {
  position: relative;
  width: 100%;
  height: 100dvh;
  height: calc(var(--app-vh, 1vh) * 100);
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--game-background, transparent);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

canvas {
  display: block;
  grid-area: 1 / 1;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
</style>
