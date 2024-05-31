<script setup>
import { useSeek, useTres, useTresContext } from '@tresjs/core'
import { shallowRef, watch, defineProps } from 'vue'
import { useFBX } from '@tresjs/cientos'
import { PerspectiveCamera, Vector3 } from 'three'

const { camera, cameras, scene, setCameraActive, registerCamera } = useTresContext()
const { seek, seekByName, seekAll, seekAllByName } = useSeek()

var b_init = false;

const props = defineProps(['ResStoreObj'])
watch(props, () => {
    if (!b_init) {
        init();
        b_init = true;
    }
})

function init() {
    var main_fbx = props.ResStoreObj.main;
    scene.value.add(main_fbx)
    main_fbx.position.set(-7.5, 0, 7.5)
}

</script>

<template>

</template>