export default class TankLevelData {
    constructor() {
        this.map = [];
        this.totalEnemies = 20;
        this.maxEnemiesOnScreen = 4;
        this.enemySpawnRates = {
            type1: 0.4,
            type2: 0.3,
            type3: 0.2,
            type4: 0.1
        };
        this.itemDropRates = {
            life: 0.1,
            stop: 0.15,
            iron: 0.1,
            bomb: 0.05,
            star: 0.1,
            shield: 0.1
        };
    }

    generateLevel1() {
        const mapWidth = 26;
        const mapHeight = 24;
        this.map = new Array(mapWidth * mapHeight).fill(0);
        
        // 创建边界墙
        for (let c = 0; c < mapWidth; c++) {
            this.map[c] = 2; // 顶部边界
            this.map[(mapHeight - 1) * mapWidth + c] = 2; // 底部边界
        }
        
        for (let r = 0; r < mapHeight; r++) {
            this.map[r * mapWidth] = 2; // 左边界
            this.map[r * mapWidth + mapWidth - 1] = 2; // 右边界
        }
        
        // 创建基地
        const baseCenterR = mapHeight - 2;
        const baseCenterC = mapWidth / 2 - 1;
        
        this.map[baseCenterR * mapWidth + baseCenterC] = 6;
        this.map[baseCenterR * mapWidth + baseCenterC + 1] = 6;
        this.map[(baseCenterR + 1) * mapWidth + baseCenterC] = 6;
        this.map[(baseCenterR + 1) * mapWidth + baseCenterC + 1] = 6;
        
        // 基地周围的保护墙
        for (let r = baseCenterR - 1; r < baseCenterR + 3; r++) {
            for (let c = baseCenterC - 1; c < baseCenterC + 3; c++) {
                if (r >= 0 && r < mapHeight && c >= 0 && c < mapWidth) {
                    const index = r * mapWidth + c;
                    if (this.map[index] === 0) {
                        this.map[index] = 2;
                    }
                }
            }
        }
        
        // 添加一些砖块障碍物
        const brickPatterns = [
            { r: 2, c: 2, width: 4, height: 2 },
            { r: 2, c: 8, width: 3, height: 2 },
            { r: 8, c: 8, width: 2, height: 2 },
            { r: 12, c: 12, width: 2, height: 2 },
        ];
        
        brickPatterns.forEach(pattern => {
            for (let r = pattern.r; r < pattern.r + pattern.height; r++) {
                for (let c = pattern.c; c < pattern.c + pattern.width; c++) {
                    if (r >= 0 && r < mapHeight && c >= 0 && c < mapWidth) {
                        const index = r * mapWidth + c;
                        if (this.map[index] === 0) {
                            this.map[index] = 1;
                        }
                    }
                }
            }
        });
        
        return this;
    }

    getTileType(row, col) {
        const mapWidth = 26;
        const index = row * mapWidth + col;
        return this.map[index] || 0;
    }

    setTileType(row, col, type) {
        const mapWidth = 26;
        const index = row * mapWidth + col;
        this.map[index] = type;
    }

    isWalkable(row, col) {
        const tileType = this.getTileType(row, col);
        return tileType === 0 || tileType === 3; // 空地或草地可通行
    }

    isDestructible(row, col) {
        const tileType = this.getTileType(row, col);
        return tileType === 1; // 砖块可被摧毁
    }
} 