<template>
    <div class="game-container">
        <canvas ref="pixiContainer"></canvas>
        <PixiLoader :textureUrls="textureUrls" @loaded="onTexturesLoaded" />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { GameApp, GameLayer } from './GameApp';
import BgCircle from './BgCircle';
import PlayerSnake from './PlayerSnake';
import EnermySnake from './EnermySnake';
import Cube from './Cube';
import { checkSnakeCollisions } from './collision';
import FailScreen from './FailScreen';
import StartScreen from './StartScreen';
import { initDom } from '../pixi/PixiHelper';
import PixiLoader from '../pixi/PixiLoader.vue';

const pixiContainer = ref(null);
const gameApp = GameApp.instance;
let autoRemoveTimers = [];

// 需要加载的纹理资源（请根据实际用到的图片补全）
const textureUrls = [
    'game2048/star_small.png',
    'game2048/ship_E.png',
    'game2048/player_blood_bg.png',
    'game2048/player_blood_bar.png',
    'game2048/enemy_B.png',
    'game2048/bullet1.png'
];

// 纹理加载完成回调
const onTexturesLoaded = async (textures) => {
    console.log('所有纹理加载完成');
    // 适配画布
    initDom(pixiContainer.value, { designWidth: 1080, designHeight: 1920, isFullScreen: true });
    gameApp.init(pixiContainer.value);
    createBgCircle();
    setGameState('init');
};

onUnmounted(() => {
    clearGame();
    gameApp.destroy();
});

function setGameState(state, initialValue = 2) {
    if(gameApp.gameState === state){
        return;
    }
    gameApp.gameState = state;
    if (state === 'init') {
        showStartScreen();
    }else if (state === 'playing') {
        startGame(initialValue);
    }else if (state === 'fail') {
        setTimeout(showFailScreen, 500);
    }
}

function showStartScreen() {
    gameApp.addUI(new StartScreen({
        onStart: onClickStart
    }));
}

function onClickStart(initialValue) {
    setGameState('playing', initialValue);
}

function startGame(initialValue = 2) {
    clearGame();
    createPlayerSnake(initialValue);
    ensureLooseCubes();
    autoRemoveTimers.push(setInterval(ensureLooseCubes, 5000));
    createEnermySnakes();
    autoRemoveTimers.push(setInterval(createEnermySnakes, 5000));
    gameApp.pixi.ticker.add(checkSnakeCollisions);
    gameApp.pixi.ticker.add(checkGameOver);
    gameApp.pixi.ticker.add(initCenterSnake);
    window.addEventListener('keydown', handleKeyDown);
}

function clearGame() {
    window.removeEventListener('keydown', handleKeyDown);
    for (const timer of autoRemoveTimers) {
        clearInterval(timer);
    }
    autoRemoveTimers = [];
    gameApp.pixi.ticker.remove(checkSnakeCollisions);
    gameApp.pixi.ticker.remove(checkGameOver);
    gameApp.pixi.ticker.remove(initCenterSnake);
    gameApp.clearAllGameObjects();
    gameApp.clearUI();
}


function checkGameOver() {
    if (!gameApp.playerSnake || !gameApp.playerSnake.cubes || gameApp.playerSnake.cubes.length === 0) {
        setGameState('fail');
    }
}

function showFailScreen() {
    gameApp.addUI(new FailScreen({
        onRestart: () => {
            clearGame();
            setGameState('init');
        }
    }));
}


function initCenterSnake(delta) {
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
}

function createBgCircle() {
    const circle = new BgCircle();
    circle.init();
    gameApp.addGameObject(circle, GameLayer.BgLayer);
}

function createPlayerSnake(initialValue = 2) {
    if (gameApp.playerSnake) {
        gameApp.gameContainer.removeChild(gameApp.playerSnake);
        if (typeof gameApp.playerSnake.destroy === 'function') {
            gameApp.playerSnake.destroy();
        }
    }
    const snake = new PlayerSnake();
    // 使用initialValue作为蛇头的初始值
    snake.addCube(initialValue);
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
            if (Math.sqrt(dx * dx + dy * dy) >= minDist) break;
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
