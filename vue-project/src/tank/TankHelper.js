class TankHelper {
    constructor() {
        this.TileType = {
            Brick: 1,
            Iron: 2,
            Grass: 3,
            Water: 4,
            Home: 9,
            Wall: 99,
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


    getSrcMaps() {
        return [
            `第1关
            1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1
1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1	1
1	1																							2
1	1																							
1	1																							2
1	1																							
1	1																							2
1	1																							
1	1																							2
1	1																							
1	1																							2
1	1																							
1	1																							2
1	1																							
1	1																							2
1	1																							
1	1																							2
1	1																							
1	1			1	1	1	1	1	1	1	1	1												2
1	1			1	1	1	1	1	1	1	1	1												
1	1			1	1																			2
1	1			1	1																			
1	1			1	1					1	1	1	1	1	1									2
1	1			1	1					1	1	1	1	1	1									
1	1			1	1					1	1	9		1	1									2
1	1			1	1					1	1			1	1									
`
        ]
    }
}



export default new TankHelper()