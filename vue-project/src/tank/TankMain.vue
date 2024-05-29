<script setup>

import { OrbitControls } from '@tresjs/cientos'

</script>

<template>
    <TresCanvas clear-color="#006400">
        <TresPerspectiveCamera :position="[3, 3, 3]" :look-at="[0, 0, 0]" />
        <TresMesh>
            <TresTorusGeometry :args="[1, 0.5, 16, 32]" />
            <TresMeshStandardMaterial color="orange" />
        </TresMesh>
        <TresAmbientLight :intensity="2" />
        <TresPointLight></TresPointLight>
        <OrbitControls />

    </TresCanvas>
</template>