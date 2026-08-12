<script setup>
import { onBeforeUnmount, ref } from 'vue'
import GameCanvas from '../game-guide/GameCanvas.vue'
import { textures } from './Game2048Assets.js'
import Game2048App from './Game2048App.js'

const view = ref(null)
let game

function start(textures) {
    game?.destroy()
    game = new Game2048App(textures)
    game.init(view.value.canvas)
}

onBeforeUnmount(() => game?.destroy())
</script>

<template>
    <GameCanvas ref="view" class="game2048-canvas" :textures="textures" @ready="start" />
</template>

<style scoped>
.game2048-canvas {
    --game-background: #000;
    --game-loading-background: #000;
    --game-loading-color: #fff;
}
</style>
