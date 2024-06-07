<script setup>
import { useSeek, useTres, useTresContext, useRenderLoop } from '@tresjs/core'
import { Text3D } from '@tresjs/cientos'
import { shallowRef, ref, watch } from 'vue'
import { useFBX } from '@tresjs/cientos'
import { PerspectiveCamera, TangentSpaceNormalMap, Vector3, Raycaster, Ray } from 'three'
import { BufferGeometry, LineBasicMaterial, Line } from 'three'
import TankHelper from './TankHelper'
import TankPlayer from './TankPlayer'

const { camera, cameras, scene, setCameraActive, registerCamera, raycaster } = useTresContext()
const { seek, seekByName, seekAll, seekAllByName } = useSeek()

window.tankgame = {
    inputs: {},
    speed: 2,
    raycaster: new Raycaster(),
    rayLine: null,
    tiles: [],
    b_init: false,
    player_1: null,
    visible: true,
}

const props = defineProps(['ResStoreObj'])
watch(props, () => {
    if (!tankgame.b_init) {
        init();
        tankgame.b_init = true;
        scene.value.visible = tankgame.visible
    }
})

const tileRoot = shallowRef()

function init() {
    var main_fbx = props.ResStoreObj.main.clone();
    scene.value.add(main_fbx)
    main_fbx.position.set(-7.5, 0, 7.5)

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

// centerPos: 世界坐标
// cellSize: 占几个格子，一个格子占0.5大小
function getStandGrid(centerPos, cellCount) {
    let standGrid = {};

    let centerRC = getRCByPosition(centerPos);
    let halfCellCount = Math.floor(cellCount / 2);

    if (Number.isInteger(centerPos.z / 0.5)) {
        standGrid.minR = centerRC.r - halfCellCount;
        standGrid.maxR = centerRC.r;
    }
    else {
        standGrid.minR = centerRC.r - halfCellCount;
        standGrid.maxR = centerRC.r + halfCellCount;
    }

    if (Number.isInteger(centerPos.x / 0.5)) {
        standGrid.minC = centerRC.c - halfCellCount;
        standGrid.maxC = centerRC.c;
    }
    else {
        standGrid.minC = centerRC.c - halfCellCount;
        standGrid.maxC = centerRC.c + halfCellCount;
    }
    return standGrid;
}

function getBlockTileRCs(standGrid, direction) {
    let blockRCs = [];
    if (direction == TankHelper.Direction.Up) {
        for (let r = standGrid.minR; r >= 0; --r) {
            for (let c = standGrid.minC; c <= standGrid.maxC; ++c) {
                var tile = getTile(r, c);
                if (tile.tileType) {
                    blockRCs.push({ r, c });
                }
            }
        }
    }
    else if (direction == TankHelper.Direction.Down) {
        for (let r = standGrid.maxR; r <= Rows - 1; ++r) {
            for (let c = standGrid.minC; c <= standGrid.maxC; ++c) {
                var tile = getTile(r, c);
                if (tile.tileType) {
                    blockRCs.push({ r, c });
                }
            }
        }
    }
    else if (direction == TankHelper.Direction.Left) {
        for (let c = standGrid.minC; c >= 0; --c) {
            for (let r = standGrid.minR; r <= standGrid.maxR; ++r) {
                var tile = getTile(r, c);
                if (tile.tileType) {
                    blockRCs.push({ r, c });
                }
            }
        }
    }
    else if (direction == TankHelper.Direction.Right) {
        for (let c = standGrid.maxC; c <= Cols - 1; ++c) {
            for (let r = standGrid.minR; r <= standGrid.maxR; ++r) {
                var tile = getTile(r, c);
                if (tile.tileType) {
                    blockRCs.push({ r, c });
                }
            }
        }
    }
    return blockRCs;
}

function getCanMoveLength(direction) {
    var pos = player_1.position.clone();
    var standGrid = getStandGrid(player_1.position, 2);
    var blockRCs = getBlockTileRCs(standGrid, direction);

    var blockRC = blockRCs[0];
    var canMove = 0;
    if (!blockRC) {
        if (direction == TankHelper.Direction.Up) {
            canMove = pos.z - (-6);
        }
        else if (direction == TankHelper.Direction.Down) {
            canMove = 6 - pos.z;
        }
        else if (direction == TankHelper.Direction.Left) {
            canMove = pos.x - (-6);
        }
        else if (direction == TankHelper.Direction.Right) {
            canMove = 6 - pos.x;
        }
    }
    else {
        var blockPos = getPositionByRC(blockRC);
        if (direction == TankHelper.Direction.Up) {
            canMove = (pos.z - 0.5) - (blockPos.z + 0.25);
        }
        else if (direction == TankHelper.Direction.Down) {
            canMove = (blockPos.z - 0.25) - (pos.z + 0.5);
        }
        else if (direction == TankHelper.Direction.Left) {
            canMove = (pos.x - 0.5) - (blockPos.x + 0.25);
        }
        else if (direction == TankHelper.Direction.Right) {
            canMove = (blockPos.x - 0.25) - (pos.x + 0.5);
        }
    }

    // console.log(`canMove=${canMove}`);
    return canMove;
}

const player = shallowRef()

const { onLoop } = useRenderLoop()
onLoop(({ delta, elapsed }) => {

    if (player_1) {

    }

    if (player.value) {
        player.value.move();
    }

    updateRayHelper()
})

function initPlayer() {
    var obj = props.ResStoreObj.tank_player_1.clone();
    tileRoot.value.add(obj);
    obj.position.set(-5.25, 0, -4.75)
    obj.position.copy(getPositionByRC(24, 9).add(new Vector3(-0.25, 0, +0.25)))
    tankgame.obj = player_1

}

function initMap(mapId) {
    var mapData = TankHelper.maps[mapId];
    for (let r = 0; r < mapData.length; r++) {
        const line = mapData[r];
        for (let c = 0; c < line.length; c++) {
            const tileType = line[c];
            const index = getIndexByRC(r, c);
            var obj = null;
            var tileSize = 0;
            if (tileType == TankHelper.TileType.Brick) {
                var obj = props.ResStoreObj.tile1.clone();
                tileRoot.value.add(obj);
                obj.position.copy(getPositionByRC(r, c))
                tileSize = 1;
            }
            else if (tileType == TankHelper.TileType.Iron) {
                var obj = props.ResStoreObj.tile2.clone();
                tileRoot.value.add(obj);
                obj.position.x = c * 0.5 - 6
                obj.position.z = r * 0.5 - 6
                tileSize = 2;
            }
            else if (tileType == TankHelper.TileType.Home) {
                var obj = props.ResStoreObj.tile9.clone();
                tileRoot.value.add(obj);
                obj.position.x = c * 0.5 - 6
                obj.position.z = r * 0.5 - 6
                tileSize = 2;
            }

            if (tileSize == 1) {
                tankgame.tiles[index] = { tileType, obj };
            }
            else if (tileSize == 2) {
                tankgame.tiles[index] = { tileType, obj };
                tankgame.tiles[getIndexByRC(r, c + 1)] = { tileType, obj };
                tankgame.tiles[getIndexByRC(r + 1, c)] = { tileType, obj };
                tankgame.tiles[getIndexByRC(r + 1, c + 1)] = { tileType, obj };
            }

            if (!tankgame.tiles[index]) {
                tankgame.tiles[index] = { tileType: 0, obj: null }
            }
        }
    }
}

function getRCByIndex(index) {
    let rc = {};
    rc.r = Math.floor(index / Cols);
    rc.c = index % Cols;
    return rc;
}
function getIndexByRC(r, c) {
    if (typeof (r) == 'object') {
        var { r, c } = r;

    }
    return r * Cols + c;
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
window.getRCByPosition = getRCByPosition;
function isIndexInTile(index) {
    return index >= 0 && index < 26 * 26;
}
function isRCInTile(r, c) {
    if (typeof (r) == 'object') {
        var { r, c } = r;
    }
    return r >= 0 && r < Rows && c >= 0 && c < Cols;
}
function getTile(r, c) {
    var index = getIndexByRC(r, c);
    return tankgame.tiles[index];
}
window.getTile = getTile;
// 获取的是rc中心的位置
function getPositionByRC(r, c) {
    if (typeof (r) == 'object') {
        var { r, c } = r;
    }
    return new Vector3(c * 0.5 - 6.25, 0, r * 0.5 - 6.25)
}
window.getPositionByRC = getPositionByRC;

const debugtext = ref("show")


</script>

<template>
    <TresGroup ref="tileRoot" :position="[0, 0, 0]"></TresGroup>
    <TankPlayer ref="player"></TankPlayer>
</template>