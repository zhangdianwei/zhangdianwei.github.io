<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as PIXI from 'pixi.js';

const pixiContainer = ref(null);
let app = {
    pixi: null,
    root: null,
    bg: null,
    radius: 0,
    diameter: 0
};

function resizeApp() {}

onMounted(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    app.diameter = Math.min(width, height)*0.9;
    app.radius = app.diameter / 2;
    app.pixi = new PIXI.Application({
        width,
        height,
        backgroundAlpha: 0, // 透明背景
        antialias: true, // 开启抗锯齿
    });
    if (pixiContainer.value) {
        pixiContainer.value.appendChild(app.pixi.view);
    }
    // 创建一个container，使其中心在画布中心
    app.root = new PIXI.Container();
    app.root.x = width / 2;
    app.root.y = height / 2;
    app.pixi.stage.addChild(app.root);
    // 画一个圆，圆心在(0,0)，即container中心
    app.bg = new PIXI.Graphics();
    app.bg.lineStyle(5, 0xcccccc); // 5px浅灰色描边
    // 不填充
    app.bg.drawCircle(0, 0, app.radius); // 半径自适应
    app.bg.x = 0;
    app.bg.y = 0;
    app.root.addChild(app.bg);
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