<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Button, Progress } from 'view-ui-plus'
import * as PIXI from 'pixi.js'

const props = defineProps({
  textureUrls: { type: Array, default: () => [] },
  timeout: { type: Number, default: 15000 },
})
const emit = defineEmits(['loaded'])
const loading = ref(true)
const failedUrl = ref('')
const progress = ref(0)
let loadId = 0

const loadOne = (url) => {
  let timer
  return Promise.race([
    PIXI.Assets.load(url),
    new Promise((_, reject) => { timer = window.setTimeout(() => reject(url), props.timeout) }),
  ]).finally(() => window.clearTimeout(timer))
}

async function load() {
  const id = ++loadId
  loading.value = true
  failedUrl.value = ''
  progress.value = 0
  const textures = {}

  try {
    for (const [index, url] of props.textureUrls.entries()) {
      textures[url] = await loadOne(url)
      if (id !== loadId) return
      progress.value = Math.round((index + 1) / props.textureUrls.length * 100)
    }
    if (id !== loadId) return
    loading.value = false
    emit('loaded', textures)
  } catch (url) {
    if (id === loadId) failedUrl.value = String(url)
  }
}

onMounted(load)
watch(() => props.textureUrls, load)
onBeforeUnmount(() => { loadId++ })
</script>

<template>
  <div v-if="loading" class="texture-loader">
    <div v-if="!failedUrl" class="loader-panel">
      <Progress :percent="progress" :stroke-width="6" hide-info />
      <span>加载中 {{ progress }}%</span>
    </div>
    <div v-else class="loader-panel">
      <span>资源加载失败</span>
      <Button type="primary" size="small" @click="load">重试</Button>
    </div>
  </div>
</template>

<style scoped>
.texture-loader {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  background: rgba(247, 250, 248, 0.94);
}

.loader-panel {
  width: min(240px, 70vw);
  display: grid;
  gap: 12px;
  color: #65766e;
  font-size: 13px;
  text-align: center;
}
</style>
