<script setup>

import { OrbitControls } from '@tresjs/cientos'
import { TresCanvas } from '@tresjs/core'
import { shallowRef } from 'vue';

const canvasRef = shallowRef(null);

</script>

<template>
    <div class="scene-page">
        <TresCanvas ref="canvasRef" clear-color="#e0eee8" window-size>
            <TresPerspectiveCamera :position="[0, 20, 0]" :rotation="[0, 0, 0]"></TresPerspectiveCamera>
            <TresAmbientLight :intensity="1" />

            <TresAxesHelper></TresAxesHelper>
            <TresGridHelper></TresGridHelper>

            <OrbitControls />
        </TresCanvas>
    </div>
</template>

<style scoped>
.scene-page {
    width: 100%;
    height: 100dvh;
}
</style>
