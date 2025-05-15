<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as PIXI from 'pixi.js';

const pixiContainer = ref(null);
let app = null;
let container = null;
let bg = null;
let size = 0;

function resizeApp() {
    return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    size = Math.min(width, height);
    if (pixiContainer.value) {
        pixiContainer.value.style.width = width + 'px';
        pixiContainer.value.style.height = height + 'px';
    }
    if (app) {
        app.renderer.resize(width, height);
        // container始终居中
        if (container) {
            container.x = width / 2;
            container.y = height / 2;
        }
        // 圆半径自适应
        if (bg) {
            bg.clear();
            bg.beginFill(0xffffff);
            bg.drawCircle(0, 0, size); // 半径自适应
            bg.endFill();
        }
    }
}

onMounted(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    size = Math.min(width, height);
    app = new PIXI.Application({
        width,
        height,
        backgroundAlpha: 0 // 透明背景
    });
    if (pixiContainer.value) {
        pixiContainer.value.appendChild(app.view);
    }
    // 创建一个container，使其中心在画布中心
    container = new PIXI.Container();
    container.x = width / 2;
    container.y = height / 2;
    app.stage.addChild(container);
    // 画一个圆，圆心在(0,0)，即container中心
    bg = new PIXI.Graphics();
    bg.beginFill(0xffffff); // 白色圆
    bg.drawCircle(0, 0, size/2); // 半径自适应
    bg.endFill();
    bg.x = 0;
    bg.y = 0;
    container.addChild(bg);
    window.addEventListener('resize', resizeApp);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeApp);
    if (app) {
        app.destroy(true, { children: true });
        app = null;
    }
});
</script>

<template>
    <div ref="pixiContainer" class="pixi-full"></div>
</template>

<style scoped>
.pixi-full {
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background: rgb(52, 52, 88);
    overflow: hidden;
    z-index: 0;
}
html, body, #app {
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
}
</style>