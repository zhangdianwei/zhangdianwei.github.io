<script setup>
import { useSeek, useTres, useTresContext } from '@tresjs/core'
import { shallowRef, watch, defineProps } from 'vue'
import { useFBX } from '@tresjs/cientos'
import { PerspectiveCamera, Vector3 } from 'three'
import TankHelper from './TankHelper'

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

const tileRoot = shallowRef()

function init() {
    var main_fbx = props.ResStoreObj.main;
    scene.value.add(main_fbx)
    main_fbx.position.set(-7.5, 0, 7.5)
    initMap(0)
}

function initMap(mapId) {
    var mapData = TankHelper.maps[0];
    for (let r = 0; r < mapData.length; r++) {
        const line = mapData[r];
        for (let c = 0; c < line.length; c++) {
            const tile = line[c];
            if (tile == TankHelper.TileType.Brick) {
                var obj = props.ResStoreObj.tile1.clone();
                tileRoot.value.add(obj);
                obj.position.x = c * 0.5 + 0.25;
                obj.position.z = r * 0.5 + 0.25;
            }
            else if (tile == TankHelper.TileType.Iron) {
                var obj = props.ResStoreObj.tile2.clone();
                tileRoot.value.add(obj);
                obj.position.x = c * 0.5 + 0.5;
                obj.position.z = r * 0.5 + 0.5;
            }
            else if (tile == TankHelper.TileType.Home) {
                var obj = props.ResStoreObj.tile9.clone();
                tileRoot.value.add(obj);
                obj.position.x = c * 0.5 + 0.5;
                obj.position.z = r * 0.5 + 0.5;
            }
        }
    }
}

</script>

<template>
    <TresGroup ref="tileRoot" :position="[-6.5, 0, -6.5]"></TresGroup>
</template>