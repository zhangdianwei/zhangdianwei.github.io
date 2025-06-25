<template>
    <canvas ref="pixiContainer"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import gameApp from './GameApp.js';

const pixiContainer = ref(null);

onMounted(() => {
    initGameApp();
    // 默认加载第一关
    gameApp.levelManager.loadLevel(1);
});

function initGameApp() {
    window.gameApp = gameApp;

    const options = { designWidth: 1080, designHeight: 1920, scale: 0.9 };
    gameApp.initDom(pixiContainer.value, options)
    gameApp.init(pixiContainer.value);
}

onUnmounted(() => {
    gameApp.destroy();
});
</script>

<style>
html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
