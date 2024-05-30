<script setup>
import { useSeek, useTres, useTresContext } from '@tresjs/core'
import { shallowRef, watch } from 'vue'
import { useFBX } from '@tresjs/cientos'
import { PerspectiveCamera, Vector3 } from 'three'

const { camera, cameras, scene, setCameraActive, registerCamera } = useTresContext()
const { seek, seekByName, seekAll, seekAllByName } = useSeek()

useFBX("tank/main.fbx").then((obj) => {
    scene.value.add(obj);
    obj.position.set(-6.5, 0, 6.5)
})
</script>

<template>
    <!-- <primitive :object="rootRef" :position="[-6.5, 0, 0]" /> -->
    <!-- <TresObject3D></TresObject3D> -->
</template>