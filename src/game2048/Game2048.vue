<template>
    <div ref="pixiContainer" class="pixi-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { GameApp, GameLayer, UIName } from './GameApp';
import BgCircle from './BgCircle';
import PlayerSnake from './PlayerSnake';
import EnermySnake from './EnermySnake';
import Cube from './Cube';
import { checkSnakeCollisions } from './collision';
import FailScreen from './FailScreen';
import StartScreen from './StartScreen';

const pixiContainer = ref(null);
const gameApp = GameApp.instance;
let autoRemoveTimers = [];

onMounted(() => {
    gameApp.init(pixiContainer.value, { width: window.innerWidth, height: window.innerHeight });
    createBgCircle();
    setGameState('init');
});

onUnmounted(() => {
    clearGame();
    gameApp.destroy();
});

function setGameState(state){
    if(gameApp.gameState === state){
        return;
    }
    gameApp.gameState = state;
    if (state === 'init') {
        showStartScreen();
    }else if (state === 'playing') {
        startGame();
    }else if (state === 'fail') {
        setTimeout(showFailScreen, 500);
    }
}

function showStartScreen() {
    gameApp.showUILayer(new StartScreen({
        width: gameApp.pixi.screen.width,
        height: gameApp.pixi.screen.height,
        onStart: onClickStart
    }), UIName.StartScreen);
}

function onClickStart() {
    setGameState('playing');
}

function startGame() {
    clearGame();
    createPlayerSnake();
    ensureLooseCubes();
    autoRemoveTimers.push(setInterval(ensureLooseCubes, 5000));
    createEnermySnakes();
    autoRemoveTimers.push(setInterval(createEnermySnakes, 5000));
    gameApp.pixi.ticker.add(checkSnakeCollisions);
    gameApp.pixi.ticker.add(checkGameOver);
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    handleResize();
    initCenterSnake();
}

function clearGame(){
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleKeyDown);
    for (const timer of autoRemoveTimers) {
        clearInterval(timer);
    }
    autoRemoveTimers = [];
    gameApp.pixi.ticker.remove(checkSnakeCollisions);
    gameApp.clearAllGameObjects();
}


function checkGameOver() {
    if (!gameApp.playerSnake || !gameApp.playerSnake.cubes || gameApp.playerSnake.cubes.length === 0) {
        setGameState('fail');
    }
}

function showFailScreen() {
    gameApp.showUILayer(new FailScreen({
        width: gameApp.pixi.screen.width,
        height: gameApp.pixi.screen.height,
        onRestart: onClickStart
    }), UIName.FailScreen);
}


function initCenterSnake() {
    gameApp.pixi.ticker.add(() => {
        if (gameApp.playerSnake && gameApp.playerSnake.head) {
            const head = gameApp.playerSnake.head;
            const root = gameApp.gameContainer;
            // 画布中心
            const cx = gameApp.pixi.screen.width / 2;
            const cy = gameApp.pixi.screen.height / 2;
            // 玩家蛇头相对gameContainer的坐标
            const hx = head.x;
            const hy = head.y;
            // gameContainer位置调整，使玩家蛇头居中
            root.position.set(cx - hx, cy - hy);
        }
    });
}

function createBgCircle() {
    const circle = new BgCircle();
    circle.init();
    gameApp.addGameObject(circle, GameLayer.BgLayer);
}

function createPlayerSnake() {
    if (gameApp.playerSnake) {
        gameApp.gameContainer.removeChild(gameApp.playerSnake);
        if (typeof gameApp.playerSnake.destroy === 'function') {
            gameApp.playerSnake.destroy();
        }
    }
    const snake = new PlayerSnake();
    for (let i = 3; i > 0; i--) {
        snake.addCube(2**i);
    }
    gameApp.addGameObject(snake, GameLayer.PlayerSnake);
}

function createEnermySnakes() {
    const targetCount = 5;
    if (gameApp.enemySnakes.length < targetCount) {
        const playerValue = gameApp.playerSnake?.head?.value || 2;
        const enemyValue = playerValue * 2;
        const enemy = new EnermySnake();
        enemy.addCubes([enemyValue]);
        // 生成远离玩家的位置
        let px = gameApp.playerSnake?.head?.x || 0;
        let py = gameApp.playerSnake?.head?.y || 0;
        let ex = 0, ey = 0;
        const minDist = gameApp.radius * 0.6;
        for (let i = 0; i < 10; i++) {
            ex = Math.random() * (gameApp.radius * 2) - gameApp.radius;
            ey = Math.random() * (gameApp.radius * 2) - gameApp.radius;
            const dx = ex - px;
            const dy = ey - py;
            if (Math.sqrt(dx*dx + dy*dy) >= minDist) break;
        }
        enemy.setPosition(ex, ey);
        gameApp.addGameObject(enemy, GameLayer.EnermySnake);
    }
}

function ensureLooseCubes() {
    const targetCount = 10;
    while (gameApp.looseCubes.length < targetCount) {
        const value = Math.random() < 0.8 ? 2 : 4;
        const cube = new Cube(value);
        const minR = gameApp.radius * 0.5;
        const r = Math.sqrt(Math.random() * (gameApp.radius * gameApp.radius - minR * minR) + minR * minR);
        const theta = Math.random() * Math.PI * 2;
        cube.x = Math.cos(theta) * r;
        cube.y = Math.sin(theta) * r;
        cube.rotation = Math.random() * Math.PI * 2;
        gameApp.addGameObject(cube, GameLayer.LooseCube);
    }
}

function handleResize() {
    if (gameApp.resize) {
        gameApp.resize(window.innerWidth, window.innerHeight);
    }
}

function handleKeyDown(e) {
    if (e.key === 'k') {
        startGame();
        return;
    }
    if (gameApp.handleKeyDown) {
        gameApp.handleKeyDown(e);
    }
}
</script>

<style scoped>
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
.fail-mask {
    position: fixed;
    left: 0; top: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    z-index: 9999;
}
</style>
