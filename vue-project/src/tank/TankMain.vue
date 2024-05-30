<script setup>

import { OrbitControls, RoundedBox, GLTFModel, FBXModel } from '@tresjs/cientos'
import { useLoader } from '@tresjs/core'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader'

// const { scene } = await useLoader(GLTFLoader, './models/main.gltf')

</script>

<template>
    <TresCanvas clear-color="#FDF5E6" window-size>
        <TresPerspectiveCamera :position="[3, 3, 3]" :look-at="[0, 0, 0]" />

        <Suspense>
            <FBXModel path="tank/main.fbx" />
        </Suspense>

        <TresAmbientLight :intensity="1" />
        <!-- <TresPointLight :position="[0, 0, 2]"></TresPointLight> -->
        <OrbitControls />
    </TresCanvas>
</template>