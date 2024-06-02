<script setup>
import { useSeek, useTres, useTresContext, useRenderLoop } from '@tresjs/core'
import { Text3D } from '@tresjs/cientos'
import { shallowRef, ref, watch, defineProps } from 'vue'
import { useFBX } from '@tresjs/cientos'
import { PerspectiveCamera, TangentSpaceNormalMap, Vector3, Raycaster, Ray } from 'three'
import { BufferGeometry, LineBasicMaterial, Line } from 'three'
import TankHelper from './TankHelper'

const { camera, cameras, scene, setCameraActive, registerCamera, raycaster } = useTresContext()
const { seek, seekByName, seekAll, seekAllByName } = useSeek()
const { onLoop } = useRenderLoop()

window.tankgame = {
    inputs: {},
    speed: 2,
    raycaster: new Raycaster(),
    rayLine: null,
    tiles: [],
}

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
    var main_fbx = props.ResStoreObj.main.clone();
    scene.value.add(main_fbx)
    main_fbx.position.set(-7.5, 0, 7.5)
    main_fbx.TileType = TankHelper.TileType.Wall;

    initMap(0);
    initPlayer();
    initInput();
    updateRayHelper();
}

function updateRayHelper() {
    if (!tankgame.raycaster || !tankgame.raycaster.direction) {
        return;
    }
    var target = tankgame.raycaster.ray.origin.clone();
    target.add(tankgame.raycaster.direction.clone().multiplyScalar(20))
    if (tankgame.rayLine) {
        scene.value.remove(tankgame.rayLine);
    }
    // var s = tankgame.raycaster.ray.origin;
    // var t = target;
    // console.log(`start=(${s.x},${s.y},${s.z});target=(${t.x},${t.y},${t.z})`);
    var rayGeometry = new BufferGeometry().setFromPoints([tankgame.raycaster.ray.origin, target]);
    var rayMaterial = new LineBasicMaterial({ color: 0xff0000 });
    var rayLine = new Line(rayGeometry, rayMaterial);
    scene.value.add(rayLine);
    tankgame.rayLine = rayLine;
}

function initInput() {
    document.addEventListener('keydown', function (event) {
        tankgame.inputs[event.key] = 1
    });
    document.addEventListener('keyup', function (event) {
        tankgame.inputs[event.key] = 0
    });
}

function getMoveDir() {
    var moveDir = new Vector3();
    if (tankgame.inputs['w']) {
        moveDir.z = -1;
    }
    else if (tankgame.inputs['s']) {
        moveDir.z = 1;
    }
    else if (tankgame.inputs['a']) {
        moveDir.x = -1;
    }
    else if (tankgame.inputs['d']) {
        moveDir.x = 1;
    }

    moveDir.normalize();

    return moveDir;
}

function getMoveRotation(oldRotation, moveDir) {
    if (moveDir.x > 0) {
        return -Math.PI / 2;
    }
    else if (moveDir.x < 0) {
        return Math.PI / 2;
    }
    else if (moveDir.z < 0) {
        return 0;
    }
    else if (moveDir.z > 0) {
        return Math.PI;
    }
    else {
        return oldRotation;
    }
}

function formatNum(n, precise) {
    if (typeof (n) == 'number') {
        return formatNumImpl(n, precise)
    }
    else if (n instanceof Vector3) {
        n.x = formatNumImpl(n.x, precise);
        n.y = formatNumImpl(n.y, precise);
        n.z = formatNumImpl(n.z, precise);
        return n;
    }
}
function formatNumImpl(n, precise) {
    if (precise == 0) {
        if (Math.abs(n) < 0.0001) {
            return 0;
        }
        else {
            return n;
        }
    }
    else {
        var times = Math.floor(n / precise);
        return precise * times;
    }
}

function isEqual(a, b) {
    return Math.abs(a - b) <= 0.0001;
}

function getRaycastStart(isLeft, moveRotation) {
    var start = player_1.position.clone();
    start.y += 0.25;

    var offset = 0.5;

    if (isEqual(moveRotation, 0)) {
        start.z -= offset;
        if (isLeft == -1) {
            start.x -= 0.25;
        }
        else if (isLeft == 1) {
            start.x += 0.25;
        }
    }
    else if (isEqual(moveRotation, Math.PI)) {
        start.z += offset;
        if (isLeft == -1) {
            start.x += 0.25;
        }
        else if (isLeft == 1) {
            start.x -= 0.25;
        }
    }
    else if (isEqual(moveRotation, Math.PI / 2)) {
        start.x -= offset;
        if (isLeft == -1) {
            start.z += 0.25;
        }
        else if (isLeft == 1) {
            start.z -= 0.25;
        }
    }
    else if (isEqual(moveRotation, -Math.PI / 2)) {
        start.x += offset;
        if (isLeft == -1) {
            start.z -= 0.25;
        }
        else if (isLeft == 1) {
            start.z += 0.25;
        }
    }

    return start;
}
var oldSelectObjects = [];
function getCanMoveLength(moveDir, moveRotation) {
    var start = getRaycastStart(0, moveRotation);
    var direction = new Vector3();
    if (isEqual(moveRotation, 0)) {
        direction.z -= 1;
    }
    else if (isEqual(moveRotation, Math.PI)) {
        direction.z += 1
    }
    else if (isEqual(moveRotation, Math.PI / 2)) {
        direction.x -= 1
    }
    else if (isEqual(moveRotation, -Math.PI / 2)) {
        direction.x += 1
    }
    // formatNum(direction, 0);
    tankgame.raycaster.set(start, direction);

    var intersects = tankgame.raycaster.intersectObjects(tankgame.tiles);
    for (let i = 0; i < oldSelectObjects.length; ++i) {
        oldSelectObjects[i].material.color.set(0xffffff)
    }
    // oldSelectObjects = [];
    for (let i = 0; i < intersects.length; ++i) {
        var obj = intersects[i].object;
        obj.material = obj.material.clone()
        obj.material.color.set(0x00ff00)
        if (oldSelectObjects.indexOf(obj) < 0) {
            oldSelectObjects.push(obj);
        }
        break;
    }
    window.oldSelectObjects = oldSelectObjects

    var index = 0;
    var blockObj = intersects[index];
    var group = null;
    while (blockObj) {
        group = getTileTypeObj(blockObj.object);
        if (group) {
            if (group.TileType == TankHelper.TileType.Brick || group.TileType == TankHelper.TileType.Iron) {
                break;
            }
        }
        index += 1;
        blockObj = intersects[index];
    }

    var canMove = blockObj ? blockObj.distance : 1;
    // if (group) {
    //     if (group.TileType == TankHelper.TileType.Brick) {
    //         canMove -= 0.25;
    //     }
    //     else {
    //         canMove -= 0.5;
    //     }
    // }

    // console.log(`start=(${start.toArray()});direction=(${direction.toArray()});canMove=(${canMove})`);
    return canMove;
}

function getTileTypeObj(obj) {
    while (obj && !obj.TileType) {
        obj = obj.parent;
    }
    return obj;
}

onLoop(({ delta, elapsed }) => {
    if (player_1) {
        var moveDir = getMoveDir();
        var moveRotation = getMoveRotation(player_1.rotation.y, moveDir);
        var canMoveDis = getCanMoveLength(moveDir, moveRotation);
        // canMoveDis = formatNum(canMoveDis, 0.01)
        var wantMoveDis = tankgame.speed * delta;
        wantMoveDis = 0.01;
        if (wantMoveDis > canMoveDis) {
            wantMoveDis = canMoveDis;
        }
        if (wantMoveDis < 0) {
            wantMoveDis = 0;
        }
        // console.log(`canMoveDis=${canMoveDis};wantMoveDis=${wantMoveDis};`);
        var moveVector = moveDir.multiplyScalar(wantMoveDis);

        if (moveVector.x != 0 || moveVector.z != 0) {
            console.log(`moveVector=${moveVector.toArray()}`);
            player_1.position.add(moveVector);
            // formatNum(player_1.position, 0.25)
        }
        if (moveRotation != player_1.rotation.y) {
            player_1.rotation.y = moveRotation;
        }
        // console.log(`target=${player_1.position.z - canMoveDis}`);
        console.log(`player.position=(${player_1.position.toArray()})`, `canMoveDis=${canMoveDis};wantMoveDis=${wantMoveDis};`);
    }

    updateRayHelper()
})

var player_1 = null;
function initPlayer() {
    player_1 = props.ResStoreObj.tank_player_1.clone();
    tileRoot.value.add(player_1);
    player_1.position.set(-3, 0, 4)
}

function initMap(mapId) {
    var mapData = TankHelper.maps[0];
    for (let r = 0; r < mapData.length; r++) {
        const line = mapData[r];
        for (let c = 0; c < line.length; c++) {
            const tile = line[c];
            var obj = null;
            if (tile == TankHelper.TileType.Brick) {
                var obj = props.ResStoreObj.tile1.clone();
                tileRoot.value.add(obj);
                obj.position.x = c * 0.5 - 6.25;
                obj.position.z = r * 0.5 - 6.25;
            }
            else if (tile == TankHelper.TileType.Iron) {
                var obj = props.ResStoreObj.tile2.clone();
                tileRoot.value.add(obj);
                obj.position.x = c * 0.5 - 6.0;
                obj.position.z = r * 0.5 - 6.0;
            }
            else if (tile == TankHelper.TileType.Home) {
                var obj = props.ResStoreObj.tile9.clone();
                tileRoot.value.add(obj);
                obj.position.x = c * 0.5 - 6.0;
                obj.position.z = r * 0.5 - 6.0;
            }
            if (obj) {
                obj.TileType = tile;
                tankgame.tiles.push(obj)
            }

        }
    }
}

const debugtext = ref("show")

</script>

<template>
    <TresGroup ref="tileRoot" :position="[0, 0, 0]"></TresGroup>
</template>