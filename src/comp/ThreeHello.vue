<script setup>

import { OrbitControls } from '@tresjs/cientos'
import { ref, shallowRef, watch } from 'vue';

const canvasRef = shallowRef(null);

watch(canvasRef, () => {

})

</script>

<template>
    <div>
        <TresCanvas ref="canvasRef" clear-color="#e0eee8" window-size>
            <TresPerspectiveCamera :position="[0, 20, 0]" :rotation="[0, 0, 0]"></TresPerspectiveCamera>
            <TresAmbientLight :intensity="1" />

            <TresAxesHelper></TresAxesHelper>
            <TresGridHelper></TresGridHelper>

            <OrbitControls />
        </TresCanvas>
    </div>
</template>