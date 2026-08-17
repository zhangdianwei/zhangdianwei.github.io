<script setup>
import { onBeforeUnmount, ref } from 'vue'
import GameCanvas from './GameCanvas.vue'
import { textures } from './BallGameAssets.js'
import BallGameApp from './BallGameApp.js'

const view = ref(null)
let game

function start(loadedTextures) {
  game?.destroy()
  game = new BallGameApp(loadedTextures)
  game.init(view.value.canvas)
}

onBeforeUnmount(() => game?.destroy())
</script>

<template>
  <GameCanvas ref="view" class="ball-game" :textures="textures" @ready="start" />
</template>

<style scoped>
.ball-game {
  --game-background: #111827;
  --game-loading-background: #111827;
  --game-loading-color: #f8fafc;
}
</style>
