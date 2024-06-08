
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
import TankBullet from './TankBullet'

const { onLoop } = useRenderLoop()

class TankGame {
    constructor(canvasRef) {
        this.scene = canvasRef.value.context.scene.value;
        // this.visible = false;
    }

    startGame() {
        this.rc = new RCHelper();

        this.inputs = {};

        this.tiles = [];
        this.player_1 = null;

        this.controllers = [];
        this.bullets = [];
        this.controllerShouldAdd = [];
        this.controllerShouldRemove = [];

        this.timer = new Timer();
        onLoop(this.update.bind(this));

        var platform = this.ResStore.platform.clone();
        this.scene.add(platform);

        this.tileRoot = new Group();
        this.scene.add(this.tileRoot);

        this.initMap(0);
        this.initPlayer();
        this.initInput();

        platform.visible = this.visible;
        this.tileRoot.visible = this.visible;
    }

    run() {
        this.ResStore = {};
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

            for (let i = 0; i < objs.length; ++i) {
                const obj = objs[i];
                const name = ResStoreNames[i];
                this.ResStore[name] = obj;

                var shortName = name.split('/')
                shortName = shortName[shortName.length - 1]
                shortName = shortName.split('.')
                shortName = shortName[0]
                this.ResStore[shortName] = obj;
            }

            this.startGame();
        });
    }

    initPlayer() {
        this.player_1 = new TankPlayer();
        this.addController(this.player_1);
        this.player_1.position.copy(this.rc.getPositionByRC(22, 9).add(new Vector3(-0.25, 0, 0.25)))
        this.player_1.init();
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
                    obj.position.copy(this.rc.getPositionByRC(r, c))
                    tileSize = 1;
                }
                else if (tileType == TankHelper.TileType.Home) {
                    var obj = this.ResStore.tile9.clone();
                    this.tileRoot.add(obj);
                    obj.position.x = c * 0.5 - 6
                    obj.position.z = r * 0.5 - 5.5
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
    getTilesByGrid(grid) {
        var tiles = [];
        for (let r = grid.minR; r <= grid.maxR; ++r) {
            for (let c = grid.minC; c <= grid.maxC; ++c) {
                var tile = this.getTile(r, c);
                if (tile.tileType) {
                    tiles.push(tile);
                }
            }
        }
        return tiles;
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
        var standGrid = this.rc.getStandGrid(this.player_1.position, 1);
        var blockRCs = this.getBlockTileRCs(standGrid, direction);

        var blockRC = blockRCs[0];
        var canMove = 0;
        if (!blockRC) {
            if (direction == TankHelper.Direction.Up) {
                canMove = pos.z - (-5.5);
            }
            else if (direction == TankHelper.Direction.Down) {
                canMove = 5.5 - pos.z;
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

    tick = 0;

    update({ delta, elapsed }) {
        this.checkRemoveController();
        this.checkAddController();

        // this.tick += delta;
        // if (this.tick < 0.05) {
        //     return;
        // }

        this.tick = 0;

        this.timer.update({ delta, elapsed });
        this.checkCollision({ delta, elapsed });

        this.checkRemoveController();
        this.checkAddController();
    }

    addController(controller) {
        var obj = controller.createObject();
        if (obj) {
            controller.obj = obj;
            obj.controller = controller;
            this.tileRoot.add(controller.obj);
        }

        this.controllerShouldAdd.push(controller);
        // this.checkAddController();
    }

    checkAddController() {
        for (let i = 0; i < this.controllerShouldAdd.length; i++) {
            const controller = this.controllerShouldAdd[i];

            this.controllers.push(controller);

            if (controller.CollisionType == TankHelper.CollisionType.Bullet) {
                this.bullets.push(controller);
            }
        }

        this.controllerShouldAdd.length = 0;
    }

    removeController(controller) {
        this.controllerShouldRemove.push(controller);
    }

    checkRemoveController() {
        for (let i = 0; i < this.controllerShouldRemove.length; i++) {
            const controller = this.controllerShouldRemove[i];

            var index = this.controllers.indexOf(controller);
            if (index >= 0) {
                this.controllers.splice(index, 1);
            }

            var index = this.bullets.indexOf(controller);
            if (index >= 0) {
                this.bullets.splice(index, 1);
            }

            this.tileRoot.remove(controller.obj)
        }

        this.controllerShouldRemove.length = 0;
    }

    checkCollision({ delta, elapsed }) {
        // bullet vs tile
        for (let i = 0; i < this.bullets.length; i++) {
            const bullet = this.bullets[i];
            let grid = this.rc.getStandGrid(bullet.obj.position, 0.5);

            if (this.rc.isGridInBound(grid)) {
                let tiles = this.getTilesByGrid(grid);
                if (tiles.length > 0) {
                    this.onCollisionTiles(tiles, bullet);
                }
            }
            else {
                this.removeController(bullet);
            }
        }
    }

    removeTile(r, c) {

    }

    onCollisionTiles(tiles, bullet) {
        this.removeController(bullet);

        for (let i = 0; i < tiles.length; ++i) {
            var tile = tiles[i];
            if (tile.tileType == TankHelper.TileType.Brick) {
                tile.tileType = 0;
                this.tileRoot.remove(tile.obj);
                tile.obj = null;
            }
        }
    }
}

export default TankGame