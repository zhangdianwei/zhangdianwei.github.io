import { Vector3 } from 'three'

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
        }

        this.maps = this.getMapDatas();
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
            var times = Math.floor(n / precise);
            return precise * times;
        }
    }

    isEqual(a, b) {
        return Math.abs(a - b) <= 0.0001;
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
            1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0
            0																									0
            0																								2	0
            0																									0
            1																								2	0
            0																									0
            0																								2	0
            0																									0
            0																								2	0
            1																									0
            0																								2	0
            0																									0
            0																								2	0
            0																									0
            1																								2	0
            0																									0
            0																								2	0
            0																									0
            0				1	1	1	1	1	1	1	1	1												2	0
            1				1	1	1	1	1	1	1	1	1													0
            0				1	1																			2	0
            0				1	1																				0
            0				1	1					1	1	1	1	1	1									2	0
            0				1	1					1	1	1	1	1	1										0
            1				1	1					1	1	9		1	1									2	0
            0				1	1					1	1			1	1										0
`
        ]
    }
}



export default new TankHelper()