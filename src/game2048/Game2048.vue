<template>
    <div ref="pixiContainer" class="pixi-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { GameApp } from './GameApp';
import BgCircle from './BgCircle';
import PlayerSnake from './PlayerSnake';
import EnermySnake from './EnermySnake';
import Cube from './Cube';

const pixiContainer = ref(null);
const gameApp = GameApp.instance;

onMounted(() => {
    gameApp.init(pixiContainer.value, { width: window.innerWidth, height: window.innerHeight });
    createBgCircle();
    createPlayerSnake();
    // createEnemySnakes(1);
    // ensureLooseCubes();
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    handleResize();
});

function createBgCircle() {
    if (gameApp.bgCircle) {
        gameApp.rootContainer.removeChild(gameApp.bgCircle);
        if (typeof gameApp.bgCircle.destroy === 'function') {
            gameApp.bgCircle.destroy();
        }
        gameApp.bgCircle = null;
    }
    gameApp.bgCircle = new BgCircle();
    gameApp.bgCircle.init();
    gameApp.getLayerContainer(gameApp.GameLayer?.BgLayer ?? 0).addChild(gameApp.bgCircle);
}

function createPlayerSnake() {
    if (gameApp.playerSnake) {
        gameApp.rootContainer.removeChild(gameApp.playerSnake);
        if (typeof gameApp.playerSnake.destroy === 'function') {
            gameApp.playerSnake.destroy();
        }
        gameApp.playerSnake = null;
    }
    gameApp.playerSnake = new PlayerSnake();
    gameApp.getLayerContainer(gameApp.GameLayer?.PlayerSnake ?? 3).addChild(gameApp.playerSnake);
}

function createEnemySnakes(count = 1) {
    if (Array.isArray(gameApp.enemySnakes)) {
        gameApp.enemySnakes.forEach(enemy => {
            gameApp.rootContainer.removeChild(enemy);
            if (typeof enemy.destroy === 'function') {
                enemy.destroy();
            }
        });
    }
    gameApp.enemySnakes = [];
    for (let i = 0; i < count; i++) {
        const enemy = new EnermySnake([{value:4}], 2, gameApp.playerSnake);
        gameApp.enemySnakes.push(enemy);
        gameApp.getLayerContainer(gameApp.GameLayer?.EnermySnake ?? 2).addChild(enemy);
    }
}

function ensureLooseCubes(targetCount = 5) {
    if (Array.isArray(gameApp.looseCubes) && gameApp.looseCubes.length > targetCount) {
        while (gameApp.looseCubes.length > targetCount) {
            const cube = gameApp.looseCubes.pop();
            gameApp.rootContainer.removeChild(cube);
            if (typeof cube.destroy === 'function') {
                cube.destroy();
            }
        }
    }
    while (gameApp.looseCubes.length < targetCount) {
        const value = Math.random() < 0.8 ? 2 : 4;
        const cube = new Cube(value);
        const radius = 220;
        const angle = Math.random() * Math.PI * 2;
        cube.x = 400 + Math.cos(angle) * radius;
        cube.y = 300 + Math.sin(angle) * radius;
        gameApp.looseCubes.push(cube);
        gameApp.getLayerContainer(gameApp.GameLayer?.LooseCube ?? 1).addChild(cube);
    }
}


onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleKeyDown);
    gameApp.destroy();
});

function handleResize() {
    if (gameApp.resize) {
        gameApp.resize(window.innerWidth, window.innerHeight);
    }
}

function handleKeyDown(e) {
    if (gameApp.handleKeyDown) {
        gameApp.handleKeyDown(e);
    }
}
</script>

<style>
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

.pixi-container>canvas {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
