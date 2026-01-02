<template>
    <div class="game-container">
        <PixiLoader :textureUrls="textureUrls" @loaded="onTexturesLoaded" />
        <canvas ref="gameContainer"></canvas>
    </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import PixiLoader from '../pixi/PixiLoader.vue';
import TetrisGame from './TetrisGame.js';

const gameContainer = ref(null);
const textureUrls = ref([
    "tetris/bg_center_up.png",
    "tetris/bg_center.png",
    "tetris/bg_center_self.png",
    "tetris/bg_center_other.png",
    "tetris/bg_r_1.png",
    "tetris/bg_total.png",
    "tetris/tile1.png",
    "tetris/tile2.png",
    "tetris/tile3.png",
    "tetris/tile4.png",
    "tetris/tile5.png",
    "tetris/tile6.png",
    "tetris/tile7.png",
    "tetris/arrow.png",
    "tetris/circle.png",
    "tetris/button.png",
]);

let game = new TetrisGame();
const onTexturesLoaded = (textures) => {
    game.init(gameContainer.value, textures);
    window.game = game;
};

onUnmounted(() => {
    if (game && game.net) {
        game.net.close();
        window.game = null;
    }
});
</script> 