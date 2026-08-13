<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  width: Number,
  height: Number,
})

const frameStyle = computed(() => ({
  width: props.width ? `${props.width}px` : '100%',
  height: props.height ? `${props.height}px` : 'calc(var(--app-vh, 1vh) * 100)',
}))
</script>

<template>
  <iframe :src="props.src" :style="frameStyle" :title="props.src" allowfullscreen />
</template>

<style scoped>
iframe {
  display: block;
  border: 0;
  background: #fff;
}
</style>
