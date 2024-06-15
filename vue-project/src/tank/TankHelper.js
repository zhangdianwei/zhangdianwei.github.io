import { Vector3 } from 'three'
import * as TWEEN from '@tweenjs/tween.js'

class TankHelper {
    constructor() {
        this.TileType = {
            Brick: 1,
            Iron: 2,
            Grass: 3,
            Water: 4,
            Home: 9,
        }

        this.Direction = {
            None: 0,
            Up: 1,
            Right: 2,
            Down: 3,
            Left: 4,
        };

        this.CampType = {
            Player: "Player",
            Enermy: "Enermy",
        };

        this.ObjectType = {
            Tank: "Tank",
            Bullet: "Bullet",
        };

        this.GameState = {
            Prepare: "Prepare",
            Gaming: "Gaming",
            Finish: "Finish",
        }

        this.maps = this.getMapDatas();
    }

    makeTween(obj) {
        var tween = new TWEEN.Tween(obj);
        return tween;
    }

    makeTweenTankAppear(tankObj, onComplete) {
        tankObj.position.y = -1;
        this.makeTween(tankObj.position)
            .to({ y: 0 }, 1000)
            .easing(TWEEN.Easing.Back.Out)
            .onComplete(onComplete)
            .start();
    }

    formatNum(n, precise) {
        if (typeof (n) == 'number') {
            return this.formatNumImpl(n, precise)
        }
        else if (n instanceof Vector3) {
            n.x = this.formatNumImpl(n.x, precise);
            n.y = this.formatNumImpl(n.y, precise);
            n.z = this.formatNumImpl(n.z, precise);
            return n;
        }
    }
    formatNumImpl(n, precise) {
        if (precise == 0) {
            if (Math.abs(n) < 0.0001) {
                return 0;
            }
            else {
                return n;
            }
        }
        else {
            var times = Math.round(n / precise);
            return precise * times;
        }
    }

    isEqual(a, b) {
        return Math.abs(a - b) <= 0.0001;
    }

    removeArrayValue(arr, value) {
        var index = arr.indexOf(value);
        while (index >= 0) {
            arr.splice(index, 1);
            index = arr.indexOf(value);
        }
    }

    removeArrayValueIf(arr, value) {
        var index = arr.findIndex(value);
        while (index >= 0) {
            arr.splice(index, 1);
            index = arr.indexOf(value);
        }
    }

    getMapDatas() {
        const srcMaps = this.getSrcMaps();
        const mapDatas = [];
        for (let i = 0; i < srcMaps.length; ++i) {
            const srcMap = srcMaps[i];
            const mapData = this.getMapData(srcMap);
            mapDatas.push(mapData);
        }
        return mapDatas;
    }

    getMapData(srcMap) {
        var lines = srcMap.split('\n')
        lines.shift()
        lines.pop()
        var mapData = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            var tiles = line.trim().split('\t').map((x) => parseInt(x) || 0)
            mapData[i] = tiles
        }
        return mapData;
    }

    getDirectionVector(direction) {
        const Direction2Vectors = [
            null,
            new Vector3(0, 0, -1),
            new Vector3(1, 0, 0),
            new Vector3(0, 0, 1),
            new Vector3(-1, 0, 0),
        ];
        var vec = Direction2Vectors[direction];
        if (!vec) {
            return null;
        } else {
            return vec.clone();
        }
    }


    getSrcMaps() {
        return [
            `第1关
            0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0
            0																									0
            0		1	1			1	1			1	1			1	1			1	1			1	1		0
            0		1	1			1	1			1	1			1	1			1	1			1	1		0
            0		1	1			1	1			1	1			1	1			1	1			1	1		0
            0		1	1			1	1			1	1	1	1	1	1			1	1			1	1		0
            0		1	1			1	1			1	1	1	1	1	1			1	1			1	1		0
            0		1	1			1	1			1	1			1	1			1	1			1	1		0
            0		1	1			1	1											1	1			1	1		0
            0		1	1			1	1											1	1			1	1		0
            0										1	1			1	1										0
            0										1	1			1	1										0
            1	1			1	1	1	1											1	1	1	1			1	1
            2	2			1	1	1	1											1	1	1	1			2	2
            0										1	1			1	1										0
            0										1	1	1	1	1	1										0
            0		1	1			1	1			1	1	1	1	1	1		1	1			1	1			0
            0		1	1			1	1			1	1			1	1		1	1			1	1			0
            0		1	1			1	1			1	1			1	1		1	1			1	1			0
            0		1	1			1	1										1	1			1	1			0
            0		1	1			1	1										1	1			1	1			0
            0		1	1			1	1				1	1	1	1			1	1			1	1			0
            0											1	9		1											0
            0	0	0	0	0	0	0	0	0	0	0	1			1	0	0	0	0	0	0	0	0	0	0	0
`
        ]
    }
}



export default new TankHelper()