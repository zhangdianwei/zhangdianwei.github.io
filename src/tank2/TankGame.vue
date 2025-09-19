<template>
    <div class="game-container">
        <PixiLoader :textureUrls="textureUrls" @loaded="onTexturesLoaded" />
        <canvas ref="gameContainer"></canvas>
    </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import PixiLoader from '../pixi/PixiLoader.vue';
import { TankApp } from './TankApp.js';
import { TankLogic } from './TankLogic.js';

const gameContainer = ref(null);
const textureUrls = ref([
    'tank2/bigtile_1_tile_1.png',
    'tank2/bigtile_2_tile_1.png',
    'tank2/bigtile_3_tile_1.png',
    'tank2/bigtile_4_tile_1.png',
    'tank2/bigtile_6.png',
    'tank2/player1_run_1.png',
    'tank2/player1_run_2.png',
    'tank2/enermys/enermy_1_run_1.png',
    'tank2/enermys/enermy_1_run_2.png',
    'tank2/enermys/enermy_2_run_1.png',
    'tank2/enermys/enermy_2_run_2.png',
    'tank2/enermys/enermy_3_run_1.png',
    'tank2/enermys/enermy_3_run_2.png',
    'tank2/enermys/enermy_4_run_1.png',
    'tank2/enermys/enermy_4_run_2.png',
    'tank2/born_1.png',
    'tank2/born_2.png',
    'tank2/born_3.png',
    'tank2/born_4.png',
    'tank2/born_5.png',
    'tank2/born_6.png',
    'tank2/explode_1.png',
    'tank2/explode_2.png',
    'tank2/explode_3.png'
]);

const tankApp = TankApp.instance;
tankApp.gameLogic = new TankLogic();

const onTexturesLoaded = (textures) => {
    tankApp.textures = textures;
    tankApp.gameLogic.init(gameContainer.value);
};

onUnmounted(() => {
    tankApp.gameLogic.destroy();
});
</script> 