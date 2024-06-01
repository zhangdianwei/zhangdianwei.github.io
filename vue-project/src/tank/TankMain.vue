<script setup>

import { OrbitControls } from '@tresjs/cientos'
import { useFBX } from '@tresjs/cientos'
import TankLogic from "./TankLogic.vue"
import { ref, shallowRef } from 'vue';
import { useTexture } from '@tresjs/core';
import { TextureLoader } from "three"

const textureLoader = new TextureLoader();
const brick_texture = {
    map: textureLoader.load("tank/brick-085-color.jpg"),
    normal: textureLoader.load("tank/brick-085-normal.jpg"),
}
const stone_texture = {
    map: textureLoader.load("tank/stone-076-color.jpg"),
    normal: textureLoader.load("tank/stone-076-normal.jpg"),
}


const ResStoreNames = [
    "tank/main.fbx",
    "tank/tile1.fbx",
    "tank/tile2.fbx",
    "tank/tile9.fbx",
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

    // store.tile1.children[0].material.map = brick_texture.map;
    // store.tile1.children[0].material.normalMap = brick_texture.normal;

    // store.tile2.children[0].material.map = stone_texture.map;
    // store.tile2.children[0].material.normalMap = stone_texture.normal;

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

        <OrbitControls />
    </TresCanvas>
</template>