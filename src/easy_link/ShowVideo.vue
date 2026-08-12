<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  width: Number,
  height: Number,
})

const videoStyle = computed(() => ({
  width: props.width ? `${props.width}px` : '100%',
  height: props.height ? `${props.height}px` : '100dvh',
}))
</script>

<template>
  <video :src="props.src" :style="videoStyle" controls autoplay loop playsinline />
</template>

<style scoped>
video {
  display: block;
  object-fit: contain;
  background: #111;
}
</style>
