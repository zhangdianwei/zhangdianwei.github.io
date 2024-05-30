<script setup>

import { OrbitControls } from '@tresjs/cientos'
import TankLogic from "./TankLogic.vue"

</script>

<template>
    <TresCanvas clear-color="#FDF5E6" window-size>
        <TresPerspectiveCamera :position="[0, 17, 7]" :rotation="[-1.17, 0, 0]"></TresPerspectiveCamera>
        <TresAmbientLight :intensity="1" />

        <TresAxesHelper></TresAxesHelper>
        <!-- <TresGridHelper></TresGridHelper> -->

        <TankLogic></TankLogic>

        <!-- <OrbitControls /> -->
    </TresCanvas>
</template>