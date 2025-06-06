<template>
    <div ref="pixiContainer" class="pixi-container"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as PIXI from 'pixi.js';
import BgCircle from './BgCircle.js';
import { GameApp } from './GameApp.js';
import PlayerSnake from './PlayerSnake.js';
import Cube from './Cube.js';

const pixiContainer = ref(null);
let app;
let bgCircleInstance = null;
let rootContainer;
let playerSnakeInstance = null;
const gameApp = GameApp.instance;

let cameraLerpFactor = 0.1;

// ----------- 散落Cube生成与拾取逻辑 -----------
const looseCubes = [];
let looseCubeInterval = null;
function randomCubeValue() {
    const values = [2, 4, 8];
    return values[Math.floor(Math.random() * values.length)];
}
function spawnLooseCube() {
    let tryCount = 0;
    let x, y, r, angle;
    let minR = gameApp.radius * 0.3;
    let maxR = gameApp.radius - 40;
    let ok = false;
    while (tryCount < 20 && !ok) {
        angle = Math.random() * Math.PI * 2;
        r = Math.sqrt(Math.random()) * (maxR - minR) + minR;
        x = Math.cos(angle) * r;
        y = Math.sin(angle) * r;
        ok = true;
        for (let i = 0; i < looseCubes.length; i++) {
            const c = looseCubes[i];
            const dx = c.x - x;
            const dy = c.y - y;
            if (Math.sqrt(dx*dx + dy*dy) < 40) {
                ok = false;
                break;
            }
        }
        tryCount++;
    }
    if (!ok) return; // 放弃本次生成
    const value = randomCubeValue();
    const cube = new Cube(value, x, y);
    cube.rotation = Math.random() * Math.PI * 2;
    cube.buttonMode = false;
    looseCubes.push(cube);
    if (rootContainer) rootContainer.addChild(cube);
}

function ensureLooseCubes() {
    while (looseCubes.length < 10) {
        spawnLooseCube();
    }
}

function checkSnakeHeadPickup() {
    if (!playerSnakeInstance || !playerSnakeInstance.head) return;
    const head = playerSnakeInstance.head;
    for (let i = looseCubes.length - 1; i >= 0; i--) {
        const cube = looseCubes[i];
        const dx = cube.x - head.x;
        const dy = cube.y - head.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pickupDist = 40 * ((cube.scale.x + head.scale.x) / 2);
        if (dist < pickupDist && head.currentValue >= cube.currentValue) {
            playerSnakeInstance.addCube(cube.currentValue, undefined, undefined, 1);
            if (rootContainer) rootContainer.removeChild(cube);
            looseCubes.splice(i, 1);
        }
    }
}

function onAppReady() {
    if (app && app.ticker) {
        app.ticker.add(() => {
            checkSnakeHeadPickup();
        });
    }
}

const updateCamera = () => {
    if (!app || !rootContainer || !playerSnakeInstance || !playerSnakeInstance.head) {
        return;
    }

    const screenCenterX = app.screen.width / 2;
    const screenCenterY = app.screen.height / 2;

    const headGlobalPosition = playerSnakeInstance.head.getGlobalPosition(new PIXI.Point(), false);
    const headPositionInRootSpace = rootContainer.toLocal(headGlobalPosition, undefined, undefined, true);

    let idealTargetRootX = screenCenterX - headPositionInRootSpace.x;
    let idealTargetRootY = screenCenterY - headPositionInRootSpace.y;

    const maxVisibleOverflow = Math.min(app.screen.width, app.screen.height) * 0.5; 

    // Calculate the bounds for rootContainer's position
    // This ensures the snake head, when at the game world's edge, is still visible within maxVisibleOverflow from screen edge.
    const minClampedRootX = (app.screen.width - maxVisibleOverflow) - gameApp.radius; // rootContainer.x when head at right world edge is shown at right screen edge 
    const maxClampedRootX = maxVisibleOverflow + gameApp.radius;                    // rootContainer.x when head at left world edge is shown at left screen edge
    
    const minClampedRootY = (app.screen.height - maxVisibleOverflow) - gameApp.radius;
    const maxClampedRootY = maxVisibleOverflow + gameApp.radius;

    // Clamp the ideal target position
    // Note: The min/max might seem swapped here, but it's correct because idealTargetRootX moves inversely to headPositionInRootSpace.x
    const clampedTargetRootX = Math.max(minClampedRootX, Math.min(maxClampedRootX, idealTargetRootX));
    const clampedTargetRootY = Math.max(minClampedRootY, Math.min(maxClampedRootY, idealTargetRootY));

    rootContainer.x += (clampedTargetRootX - rootContainer.x) * cameraLerpFactor;
    rootContainer.y += (clampedTargetRootY - rootContainer.y) * cameraLerpFactor;
};

const handleKeyDown = (event) => {
    if (event.code === 'Space') {
        if (playerSnakeInstance) {
            playerSnakeInstance.addCube(2); // Default value for new cube is 2
        }
    }
};


const handleResize = () => {
    if (app && app.renderer && gameApp) {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        app.renderer.resize(newWidth, newHeight);
        
        gameApp.setRadius(Math.min(newWidth, newHeight));

        // With camera follow, rootContainer's initial position might not need to be screen center,
        // as it will be updated by updateCamera. However, setting it initially can prevent a jump.
        // Or, we can let updateCamera handle it from the start.
        // For now, let's keep this to avoid an initial jump if player starts at (0,0) in world.
        if (rootContainer) {
             // This initial centering is less critical now but doesn't harm.
            // The updateCamera function will adjust it based on player position.
            // rootContainer.x = newWidth / 2;
            // rootContainer.y = newHeight / 2;
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

        // 保证初始散落Cube数量
        ensureLooseCubes();
        if (!looseCubeInterval) {
            looseCubeInterval = setInterval(() => {
                ensureLooseCubes();
            }, 20000);
        }

        // Add update functions to PIXI ticker
        if (bgCircleInstance && typeof bgCircleInstance.update === 'function') {
            app.ticker.add(bgCircleInstance.update, bgCircleInstance);
        }
        if (playerSnakeInstance && typeof playerSnakeInstance.update === 'function') {
            app.ticker.add(playerSnakeInstance.update, playerSnakeInstance);
        }

        // Add camera follow logic to the ticker
        app.ticker.add(updateCamera);

        window.addEventListener('resize', handleResize);
        handleResize();

        // Add keyboard listener for snake growth
        window.addEventListener('keydown', handleKeyDown);
        // 初始化完成后激活Cube自动拾取检测主循环
        onAppReady();
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
        app.ticker.remove(updateCamera);
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
