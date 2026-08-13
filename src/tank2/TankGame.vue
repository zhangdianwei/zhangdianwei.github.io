<script setup>
import { onBeforeUnmount, ref } from 'vue'
import GameCanvas from '../game-guide/GameCanvas.vue'
import { textures } from './TankAssets.js'
import TankApp from './TankApp.js'

const view = ref(null)
let game

function start(textures) {
  game?.destroy()
  game = new TankApp(textures)
  game.init(view.value.canvas)
}

onBeforeUnmount(() => game?.destroy())
</script>

<template>
  <GameCanvas ref="view" :textures="textures" @ready="start" />
</template>
