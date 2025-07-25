<template>
    <div class="game-container">
        <canvas ref="pixiContainer"></canvas>
    </div>
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

    const options = { designWidth: 1080, designHeight: 1920 };
    gameApp.initDom(pixiContainer.value, options)
    gameApp.init(pixiContainer.value);
}

onUnmounted(() => {
    gameApp.destroy();
});
</script>

