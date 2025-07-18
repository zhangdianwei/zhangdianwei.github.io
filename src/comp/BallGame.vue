<template>
    <div class="game-container">
        <canvas ref="pixiContainer"></canvas>
    </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as PIXI from 'pixi.js';
import { initDom, createPixi } from '../pixi/PixiHelper';

class GameApp {

    // PIXI相关
    pixi = null;

    init() {
        const options = { designWidth: 1920, designHeight: 1080, scale: 0.9 };
        initDom(pixiContainer.value, options);
        this.pixi = createPixi(pixiContainer.value);
    }

    initGame() {
    }

}
const gameApp = new GameApp();
const pixiContainer = ref(null);

onMounted(() => {
    gameApp.init();
    gameApp.initGame();
});

onUnmounted(() => {
    gameApp.destroy();
});
</script>

<style scoped>
.game-container {
    margin: 0;
    padding: 0;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    background: rgb(221, 221, 221);
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
