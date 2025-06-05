<template>
    <div ref="pixiContainer" class="pixi-container"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as PIXI from 'pixi.js';
import BgCircle from './BgCircle.js';
import { GameApp } from './GameApp.js';

const pixiContainer = ref(null);
let app;
let bgCircleInstance = null;
let rootContainer;
const gameApp = GameApp.instance;



const handleResize = () => {
    if (app && app.renderer && gameApp) {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        app.renderer.resize(newWidth, newHeight);
        
        gameApp.setRadius(Math.min(newWidth, newHeight) / 2 - 50);

        if (rootContainer) {
            rootContainer.x = newWidth / 2;
            rootContainer.y = newHeight / 2;
        }
        if (bgCircleInstance) {
            bgCircleInstance.init();
        }
    }
};

onMounted(() => {
    if (pixiContainer.value) {
        app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000000,
            antialias: true,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
        });

        pixiContainer.value.appendChild(app.view);

        rootContainer = new PIXI.Container();
        app.stage.addChild(rootContainer);
        rootContainer.x = app.screen.width / 2;
        rootContainer.y = app.screen.height / 2;

        gameApp.initApp(app);
        gameApp.setRadius(Math.min(window.innerWidth, window.innerHeight) / 2 - 50);

        bgCircleInstance = new BgCircle();
        bgCircleInstance.init(); 
        rootContainer.addChild(bgCircleInstance);
        bgCircleInstance.x = 0; 
        bgCircleInstance.y = 0;

        gameApp.rootContainer = rootContainer;
        gameApp.bgCircle = bgCircleInstance;

        window.addEventListener('resize', handleResize);
        handleResize();
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    
    gameApp.destroyGlobalResources(); 

    if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
    }
});

</script>

<style>
/* Global styles for true full-screen */
html,
body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    width: 100%;
    height: 100%;
    background-color: #000; 
}

.pixi-container {
    width: 100%;
    height: 100%;
    display: block; 
}

.pixi-container > canvas {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
