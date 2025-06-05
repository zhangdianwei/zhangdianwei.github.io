<template>
    <div ref="pixiContainer" class="pixi-container"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as PIXI from 'pixi.js';
import BgCircle from './BgCircle.js';
import { GameApp } from './GameApp.js';
import PlayerSnake from './PlayerSnake.js'; // Import the PlayerSnake class

const pixiContainer = ref(null);
let app;
let bgCircleInstance = null;
let rootContainer;
let playerSnakeInstance = null; // Declare playerSnakeInstance
const gameApp = GameApp.instance;

const handleKeyDown = (event) => {
    if (event.code === 'Space') {
        if (playerSnakeInstance && typeof playerSnakeInstance.grow === 'function') {
            playerSnakeInstance.grow(); // Default value for new cube is 2
        }
    }
};


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

        // Create Player instance
        playerSnakeInstance = new PlayerSnake(); // Uses default initialValue=2, segmentLength=30
        rootContainer.addChild(playerSnakeInstance);

        // Add update functions to PIXI ticker
        if (bgCircleInstance && typeof bgCircleInstance.update === 'function') {
            app.ticker.add(bgCircleInstance.update, bgCircleInstance);
        }
        if (playerSnakeInstance && typeof playerSnakeInstance.update === 'function') {
            app.ticker.add(playerSnakeInstance.update, playerSnakeInstance);
        }

        window.addEventListener('resize', handleResize);
        handleResize();

        // Add keyboard listener for snake growth
        window.addEventListener('keydown', handleKeyDown);
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleKeyDown);

    // Remove update functions from PIXI ticker
    if (app && app.ticker) {
        if (bgCircleInstance && typeof bgCircleInstance.update === 'function') {
            app.ticker.remove(bgCircleInstance.update, bgCircleInstance);
        }
        if (playerSnakeInstance && typeof playerSnakeInstance.update === 'function') {
            app.ticker.remove(playerSnakeInstance.update, playerSnakeInstance);
        }
    }

    if (playerSnakeInstance) {
        playerSnakeInstance.destroy({ children: true }); // Ensure internal snake and cubes are destroyed
        playerSnakeInstance = null;
    }
    
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
