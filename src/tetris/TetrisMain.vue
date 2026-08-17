<script setup>
import { onBeforeUnmount, ref } from 'vue'
import GameCanvas from './GameCanvas.vue'
import { textures } from './TetrisAssets.js'
import TetrisApp from './TetrisApp.js'
import { fontReady } from './theme.js'

const view = ref(null)
let game

async function start(textures) {
  game?.destroy()
  await fontReady
  game = new TetrisApp(textures)
  game.init(view.value.canvas)
}

onBeforeUnmount(() => game?.destroy())
</script>

<template>
  <GameCanvas ref="view" :textures="textures" @ready="start" />
</template>
