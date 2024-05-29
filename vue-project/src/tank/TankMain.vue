<script setup>

import { OrbitControls, RoundedBox } from '@tresjs/cientos'

</script>

<template>
    <TresCanvas clear-color="#FDF5E6" window-size>
        <TresPerspectiveCamera :position="[3, 3, 3]" :look-at="[0, 0, 0]" />

        <RoundedBox>
            <TresMeshStandardMaterial color="#dda15e" />
        </RoundedBox>
        <!-- <TresMesh>
            <TresBoxGeometry :args="[1, 1, 1]" />
            <TresMeshStandardMaterial color="orange" />
        </TresMesh> -->

        <TresAmbientLight :intensity="2" />
        <TresPointLight :position="[0, 0, 2]"></TresPointLight>
        <OrbitControls />

    </TresCanvas>
</template>