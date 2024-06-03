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

function getMoveDirection() {
    if (tankgame.inputs['w']) {
        return TankHelper.Direction.Up;
    }
    else if (tankgame.inputs['s']) {
        return TankHelper.Direction.Down;
    }
    else if (tankgame.inputs['a']) {
        return TankHelper.Direction.Left;
    }
    else if (tankgame.inputs['d']) {
        return TankHelper.Direction.Right;
    }
    else {
        return TankHelper.Direction.None;
    }
}

const Direction2Vectors = [
    null,
    new Vector3(0, 0, -1),
    new Vector3(1, 0, 0),
    new Vector3(0, 0, 1),
    new Vector3(-1, 0, 0),
];
function getDirectionVector(direction) {
    var vec = Direction2Vectors[direction];
    if (!vec) {
        return null;
    } else {
        return vec.clone();
    }
}
const Direction2Rotation = [
    0,
    0,
    -Math.PI / 2,
    Math.PI,
    Math.PI / 2,
]
function getMoveRotation(direction) {
    return Direction2Rotation[direction];
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


function getCanMoveLength(moveDir, moveRotation) {

    var canMove = 1;
    return canMove;
}


onLoop(({ delta, elapsed }) => {
    if (player_1) {
        var direction = getMoveDirection();
        if (direction) {
            var moveRotation = getMoveRotation(direction);
            // console.log(`moveRotation=${moveRotation}`);
            if (moveRotation != player_1.rotation.y) {
                player_1.rotation.y = moveRotation;
            }

            var canMoveLength = getCanMoveLength(direction);
            if (canMoveLength > 0) {
                var wantMoveLength = tankgame.speed * delta;
                if (wantMoveLength > canMoveLength) {
                    wantMoveLength = canMoveLength;
                }
                var moveVector = getDirectionVector(direction).multiplyScalar(wantMoveLength)
                console.log(`moveVector=(${moveVector.toArray()})`);
                player_1.position.add(moveVector)
            }
        }
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
            const tileType = line[c];
            const index = getIndexByRC(r, c);
            var obj = null;
            if (tileType == TankHelper.TileType.Brick) {
                var obj = props.ResStoreObj.tile1.clone();
                tileRoot.value.add(obj);
                obj.position.x = c * 0.5 - 6.25;
                obj.position.z = r * 0.5 - 6.25;
            }
            else if (tileType == TankHelper.TileType.Iron) {
                var obj = props.ResStoreObj.tile2.clone();
                tileRoot.value.add(obj);
                obj.position.x = c * 0.5 - 6.0;
                obj.position.z = r * 0.5 - 6.0;
            }
            else if (tileType == TankHelper.TileType.Home) {
                var obj = props.ResStoreObj.tile9.clone();
                tileRoot.value.add(obj);
                obj.position.x = c * 0.5 - 6.0;
                obj.position.z = r * 0.5 - 6.0;
            }
            if (obj) {
                obj.TileType = tileType;
            }
            tankgame.tiles[index] = obj;

        }
    }
}

function getRCByIndex(index) {
    let rc = {};
    rc.r = Math.floor(index / 26);
    rc.c = index % 26;
    return rc;
}
function getIndexByRC(r, c) {
    if (typeof (r) == 'object') {
        return r.r * 26 + r.c;
    }
    else {
        return r * 26 + c;
    }
}
function getIndexByPosition(pos) {
    return getIndexByRC(getRCByPosition(pos));
}
function getRCByPosition(pos) {
    let rc = {};
    rc.r = Math.floor((pos.z + 6.5) / 0.5);
    rc.c = Math.floor((pos.x + 6.5) / 0.5);
    return rc;
}

const debugtext = ref("show")

</script>

<template>
    <TresGroup ref="tileRoot" :position="[0, 0, 0]"></TresGroup>
</template>