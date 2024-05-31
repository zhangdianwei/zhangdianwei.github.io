<script setup>

import { OrbitControls } from '@tresjs/cientos'
import { useFBX } from '@tresjs/cientos'
import TankLogic from "./TankLogic.vue"
import { ref, shallowRef } from 'vue';

const ResStoreNames = [
    "tank/main.fbx",
]
const ResStoreObj = shallowRef(null)
useFBX(ResStoreNames).then((objs) => {
    const store = {}
    for (let i = 0; i < objs.length; ++i) {
        const obj = objs[i];
        const name = ResStoreNames[i];
        store[name] = obj;

        var shortName = name.split('/')
        shortName = shortName[shortName.length - 1]
        shortName = shortName.split('.')
        shortName = shortName[0]
        store[shortName] = obj;
    }
    ResStoreObj.value = store;
});

</script>

<template>
    <TresCanvas clear-color="#FDF5E6" window-size>
        <TresPerspectiveCamera :position="[0, 17, 7.5]" :rotation="[-1.19, 0, 0]"></TresPerspectiveCamera>
        <TresAmbientLight :intensity="1" />

        <TresAxesHelper></TresAxesHelper>
        <!-- <TresGridHelper></TresGridHelper> -->

        <TankLogic :ResStoreObj="ResStoreObj"></TankLogic>

        <!-- <OrbitControls /> -->
    </TresCanvas>
</template>