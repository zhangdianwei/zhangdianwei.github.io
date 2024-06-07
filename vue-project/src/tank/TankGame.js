
import { useSeek, useTres, useTresContext, useRenderLoop } from '@tresjs/core'
import { Text3D } from '@tresjs/cientos'
import { shallowRef, ref, watch } from 'vue'
import { useFBX } from '@tresjs/cientos'
import { Group, Vector3 } from 'three'
import { BufferGeometry, LineBasicMaterial, Line } from 'three'
import TankHelper from './TankHelper'
import RCHelper from './RCHelper'
import TankPlayer from './TankPlayer'
import Timer from './Timer'

const { onLoop } = useRenderLoop()

class TankGame {
    constructor(canvasRef) {
        this.scene = canvasRef.value.context.scene.value;

        this.ResStore = null;

        this.rc = new RCHelper(26, 26);

        this.inputs = {};

        this.tiles = [];
        this.player_1 = null;

        // this.visible = false;
    }

    run() {
        this.loadResource();
    }

    loadResource() {

        const ResStoreNames = [
            "tank/platform.fbx",
            "tank/tile1.fbx",
            "tank/tile2.fbx",
            "tank/tile9.fbx",
            "tank/bullet_player.fbx",
            "tank/tank_player_1.fbx",
        ]

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

            this.ResStore = store;

            this.initGame();
        });
    }

    initGame() {
        this.platform = this.ResStore.platform.clone();
        this.scene.add(this.platform);
        this.platform.position.set(-7.5, 0, 7.5);

        this.tileRoot = new Group();
        this.scene.add(this.tileRoot);

        this.initMap(0);
        this.initPlayer();
        this.initInput();

        this.timer = new Timer();
        onLoop(this.update.bind(this));

        this.platform.visible = this.visible;
        this.tileRoot.visible = this.visible;
    }

    initPlayer() {
        this.player_1 = new TankPlayer();
    }

    initInput() {
        document.addEventListener('keydown', (event) => {
            this.inputs[event.key] = 1
        });
        document.addEventListener('keyup', (event) => {
            this.inputs[event.key] = 0
        });
    }

    initMap(mapId) {
        var mapData = TankHelper.maps[mapId];
        for (let r = 0; r < mapData.length; r++) {
            const line = mapData[r];
            for (let c = 0; c < line.length; c++) {
                const tileType = line[c];
                const index = this.rc.getIndexByRC(r, c);
                var obj = null;
                var tileSize = 0;
                if (tileType == TankHelper.TileType.Brick) {
                    var obj = this.ResStore.tile1.clone();
                    this.tileRoot.add(obj);
                    obj.position.copy(this.rc.getPositionByRC(r, c))
                    tileSize = 1;
                }
                else if (tileType == TankHelper.TileType.Iron) {
                    var obj = this.ResStore.tile2.clone();
                    this.tileRoot.add(obj);
                    obj.position.x = c * 0.5 - 6
                    obj.position.z = r * 0.5 - 6
                    tileSize = 2;
                }
                else if (tileType == TankHelper.TileType.Home) {
                    var obj = this.ResStore.tile9.clone();
                    this.tileRoot.add(obj);
                    obj.position.x = c * 0.5 - 6
                    obj.position.z = r * 0.5 - 6
                    tileSize = 2;
                }

                if (tileSize == 1) {
                    this.tiles[index] = { tileType, obj };
                }
                else if (tileSize == 2) {
                    this.tiles[index] = { tileType, obj };
                    this.tiles[this.rc.getIndexByRC(r, c + 1)] = { tileType, obj };
                    this.tiles[this.rc.getIndexByRC(r + 1, c)] = { tileType, obj };
                    this.tiles[this.rc.getIndexByRC(r + 1, c + 1)] = { tileType, obj };
                }

                if (!this.tiles[index]) {
                    this.tiles[index] = { tileType: 0, obj: null }
                }
            }
        }
    }

    getTile(r, c) {
        var index = this.rc.getIndexByRC(r, c);
        return this.tiles[index];
    }


    getMoveDirection() {
        if (this.inputs['w']) {
            return TankHelper.Direction.Up;
        }
        else if (this.inputs['s']) {
            return TankHelper.Direction.Down;
        }
        else if (this.inputs['a']) {
            return TankHelper.Direction.Left;
        }
        else if (this.inputs['d']) {
            return TankHelper.Direction.Right;
        }
        else {
            return TankHelper.Direction.None;
        }
    }

    // centerPos: 世界坐标
    // cellSize: 占几个格子，一个格子占0.5大小
    getStandGrid(centerPos, cellCount) {
        let standGrid = {};

        let centerRC = this.rc.getRCByPosition(centerPos);
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

    getBlockTileRCs(standGrid, direction) {
        let blockRCs = [];
        if (direction == TankHelper.Direction.Up) {
            for (let r = standGrid.minR; r >= 0; --r) {
                for (let c = standGrid.minC; c <= standGrid.maxC; ++c) {
                    var tile = this.getTile(r, c);
                    if (tile.tileType) {
                        blockRCs.push({ r, c });
                    }
                }
            }
        }
        else if (direction == TankHelper.Direction.Down) {
            for (let r = standGrid.maxR; r <= this.rc.Rows - 1; ++r) {
                for (let c = standGrid.minC; c <= standGrid.maxC; ++c) {
                    var tile = this.getTile(r, c);
                    if (tile.tileType) {
                        blockRCs.push({ r, c });
                    }
                }
            }
        }
        else if (direction == TankHelper.Direction.Left) {
            for (let c = standGrid.minC; c >= 0; --c) {
                for (let r = standGrid.minR; r <= standGrid.maxR; ++r) {
                    var tile = this.getTile(r, c);
                    if (tile.tileType) {
                        blockRCs.push({ r, c });
                    }
                }
            }
        }
        else if (direction == TankHelper.Direction.Right) {
            for (let c = standGrid.maxC; c <= this.rc.Cols - 1; ++c) {
                for (let r = standGrid.minR; r <= standGrid.maxR; ++r) {
                    var tile = this.getTile(r, c);
                    if (tile.tileType) {
                        blockRCs.push({ r, c });
                    }
                }
            }
        }
        return blockRCs;
    }

    getCanMoveLength(direction) {
        var pos = this.player_1.position.clone();
        var standGrid = this.getStandGrid(this.player_1.position, 2);
        var blockRCs = this.getBlockTileRCs(standGrid, direction);

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
            var blockPos = this.rc.getPositionByRC(blockRC);
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

        return canMove;
    }

    update({ delta, elapsed }) {
        this.timer.update({ delta, elapsed });

        this.player_1.update({ delta, elapsed });
    }

}

export default TankGame