<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as PIXI from 'pixi.js';
import BgCircle from './BgCircle.js';
import Player from './Player.js';
import GameObjectManager from './GameObjectManager.js';
import TickManager from './TickManager.js';
import EnermyManager from './EnermyManager.js';

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
    // 集成EnermyManager
    app.enermyManager = new EnermyManager(app.player, app.gameObjectManager);
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
    // 提供全局UI刷新方法
    window.shooterApp = app;
    window.shooterApp.updatePlayerStatusUI = function(level, exp, expToLevel) {
      const elLevel = document.getElementById('player-level');
      const elExp = document.getElementById('player-exp');
      if (elLevel) elLevel.textContent = `Lv.${level}`;
      if (elExp) elExp.textContent = `EXP: ${exp}/${expToLevel}`;
    }

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
    // 显示Loading文字
    const loadingText = new PIXI.Text('Loading...', {fontSize: 36, fill: 0xffffff});
    loadingText.anchor.set(0.5);
    loadingText.x = width/2;
    loadingText.y = height/2;
    app.pixi.stage.addChild(loadingText);
    // 加载所有图片资源（兼容pixi v6/v7）
    let loadImages = [
        'shooter/ship_E.png',
        'shooter/enemy_B.png',
        'shooter/player_blood_bg.png',
        'shooter/player_blood_bar.png',
        // 如有其它图片请在此补充
    ];
    if (PIXI.Loader && PIXI.Loader.shared) {
        // pixi.js v6
        const loader = PIXI.Loader.shared;
        loadImages.forEach(img => loader.add(img));
        loader.load(() => {
            app.pixi.stage.removeChild(loadingText);
            afterAssetsLoaded();
        });
    } else if (PIXI.Assets && PIXI.Assets.load) {
        // pixi.js v7+
        PIXI.Assets.load(loadImages).then(() => {
            app.pixi.stage.removeChild(loadingText);
            afterAssetsLoaded();
        });
    } else {
        // fallback
        app.pixi.stage.removeChild(loadingText);
        afterAssetsLoaded();
    }
    function afterAssetsLoaded() {
        // 鼠标监听
        app.pixi.view.addEventListener('mousemove', (e) => {
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
    }

});

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeApp);
    if (app && app.enermyManager) {
        app.enermyManager.destroy();
    }
    if (app) {
        app.pixi.destroy(true, { children: true });
        app = null;
    }
});
</script>

<template>
    <div ref="pixiContainer" class="pixi-full"></div>
    <div id="player-status-ui" style="position:fixed;top:16px;right:24px;z-index:10;color:#fff;font-size:18px;font-family:monospace;text-align:right;text-shadow:0 1px 4px #222;pointer-events:none;">
      <div id="player-level">Lv.1</div>
      <div id="player-exp">EXP: 0/100</div>
    </div>
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