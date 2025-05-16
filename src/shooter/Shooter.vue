<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as PIXI from 'pixi.js';
import BgCircle from './BgCircle.js';
import Player from './Player.js';
import GameObjectManager from './GameObjectManager.js';
import TickManager from './TickManager.js';

const pixiContainer = ref(null);
let app = {
    pixi: null,
    tickManager: null,
    root: null,
    bg: null,
    radius: 0,
    diameter: 0,
    mouse: { x: 0, y: 0 },
    keys: { w: false, a: false, s: false, d: false },
    gameObjectManager: null,
    shooting: false
};

function resizeApp() {}

function initGame(){
    app.tickManager = new TickManager();
    initGameObjectManager();
    initBG();
    initPlayer();
}
function initGameObjectManager(){
    app.gameObjectManager = new GameObjectManager();
    app.root.addChild(app.gameObjectManager);
}
function initBG(){
    app.bg = new BgCircle();
    app.gameObjectManager.add(app.bg);
    app.bg.init();
}
function initPlayer() {
    app.player = new Player();
    app.gameObjectManager.add(app.player);
    app.player.init();
}

onMounted(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    app.diameter = Math.min(width, height)*0.9;
    app.radius = app.diameter / 2;
    window.shooterApp = app;
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
    window.addEventListener('resize', resizeApp);
    // 鼠标监听
    app.pixi.view.addEventListener('mousemove', (e) => {
        // 转换为以画布中心为原点的坐标
        const rect = app.pixi.view.getBoundingClientRect();
        app.mouse.x = e.clientX - rect.left - rect.width / 2;
        app.mouse.y = e.clientY - rect.top - rect.height / 2;
    });
    app.pixi.view.addEventListener('mousedown', (e) => {
        if (e.button === 0 && app.player && app.player.weapon) {
            app.player.weapon.shooting = true;
        }
    });
    app.pixi.view.addEventListener('mouseup', (e) => {
        if (e.button === 0 && app.player && app.player.weapon) {
            app.player.weapon.shooting = false;
        }
    });
    // 键盘监听
    window.addEventListener('keydown', (e) => {
        if (['w','a','s','d'].includes(e.key.toLowerCase())) {
            app.keys[e.key.toLowerCase()] = true;
        }
    });
    window.addEventListener('keyup', (e) => {
        if (['w','a','s','d'].includes(e.key.toLowerCase())) {
            app.keys[e.key.toLowerCase()] = false;
        }
    });
    initGame();
    // 动画循环
    app.pixi.ticker.add((ticker) => {
        const deltaTime = ticker*1000/60;
        if (app.tickManager) {
            app.tickManager.tick(deltaTime);
        }
        if (app.player) {
            app.player.lookAt(app.mouse.x, app.mouse.y);
            app.player.moveByKeys(app.keys, app.radius);
            // 持续射击
            if (app.player.weapon && app.player.weapon.shooting) {
                app.player.weapon.shoot();
            }
        }
        app.gameObjectManager.updateAll();
    });
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeApp);
    if (app) {
        app.pixi.destroy(true, { children: true });
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