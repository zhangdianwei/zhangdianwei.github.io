<script setup>

import { OrbitControls } from '@tresjs/cientos'
import { ref, shallowRef, watch } from 'vue';
import TankGame from "./TankGame"
import TankMenu from "./TankMenu.vue"

const canvasRef = shallowRef(null);

watch(canvasRef, () => {
    window.game = new TankGame(canvasRef);
    window.game.run();
})

</script>

<template>
    <div>
        <TresCanvas ref="canvasRef" clear-color="#FDF5E6" window-size>
            <TresPerspectiveCamera :position="[0, 20, 0]" :rotation="[0, 0, 0]"></TresPerspectiveCamera>
            <TresAmbientLight :intensity="1" />

            <TresAxesHelper></TresAxesHelper>
            <!-- <TresGridHelper></TresGridHelper> -->

            <!-- <TankLogic :ResStoreObj="ResStoreObj"></TankLogic> -->

            <OrbitControls />
        </TresCanvas>
        <!-- <div>
            <TankMenu></TankMenu>
        </div> -->
    </div>
</template>