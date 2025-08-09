export default class TankLevelData {
    constructor() {
        this.config = null;
        this.currentMap = [];
        this.level = 1;
        this.lives = 3;
        this.score = 0;
        this.enemiesSpawned = 0;
        this.enemiesDestroyed = 0;
        this.baseDestroyed = false;
        this.activeEffects = {
            stop: 0,
            shield: 0,
            star: 0
        };
        this.bonusesCollected = [];
        this.tilesDestroyed = 0;
    }

    // 加载关卡配置
    async loadLevel(levelNumber) {
        try {
            const response = await fetch(`src/tank2/levels/level${levelNumber}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load level ${levelNumber}`);
            }
            
            const levelConfig = await response.json();
            this.config = levelConfig;
            this.currentMap = [...levelConfig.map];
            return true;
        } catch (error) {
            console.error(`Error loading level ${levelNumber}:`, error);
            this.config = this.getDefaultLevelConfig();
            this.currentMap = [...this.config.map];
            return false;
        }
    }

    // 默认关卡配置
    getDefaultLevelConfig() {
        return {
            map: this.generateDefaultMap(),
            totalEnemies: 20,
            maxEnemiesOnScreen: 4,
            enemySpawnRates: {
                type1: 0.4,
                type2: 0.3,
                type3: 0.2,
                type4: 0.1
            },
            itemDropRates: {
                life: 0.1,
                stop: 0.15,
                iron: 0.1,
                bomb: 0.05,
                star: 0.1,
                shield: 0.1
            }
        };
    }

    // 生成默认地图
    generateDefaultMap() {
        const mapWidth = 26;
        const mapHeight = 24;
        const map = new Array(mapWidth * mapHeight).fill(0);
        
        // 创建边界墙
        for (let c = 0; c < mapWidth; c++) {
            map[c] = 2; // 顶部边界
            map[(mapHeight - 1) * mapWidth + c] = 2; // 底部边界
        }
        
        for (let r = 0; r < mapHeight; r++) {
            map[r * mapWidth] = 2; // 左边界
            map[r * mapWidth + mapWidth - 1] = 2; // 右边界
        }
        
        // 创建基地
        const baseCenterR = mapHeight - 2;
        const baseCenterC = mapWidth / 2 - 1;
        
        map[baseCenterR * mapWidth + baseCenterC] = 6;
        map[baseCenterR * mapWidth + baseCenterC + 1] = 6;
        map[(baseCenterR + 1) * mapWidth + baseCenterC] = 6;
        map[(baseCenterR + 1) * mapWidth + baseCenterC + 1] = 6;
        
        // 基地周围的保护墙
        for (let r = baseCenterR - 1; r < baseCenterR + 3; r++) {
            for (let c = baseCenterC - 1; c < baseCenterC + 3; c++) {
                if (r >= 0 && r < mapHeight && c >= 0 && c < mapWidth) {
                    const index = r * mapWidth + c;
                    if (map[index] === 0) {
                        map[index] = 2;
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
                        if (map[index] === 0) {
                            map[index] = 1;
                        }
                    }
                }
            }
        });
        
        return map;
    }

    // 获取当前地图状态
    getTileType(row, col) {
        const mapWidth = 26;
        const index = row * mapWidth + col;
        return this.currentMap[index] || 0;
    }

    // 设置当前地图状态
    setTileType(row, col, type) {
        const mapWidth = 26;
        const index = row * mapWidth + col;
        this.currentMap[index] = type;
        
        if (type === 0 && this.config.map[index] !== 0) {
            this.tilesDestroyed++;
        }
    }

    // 检查位置是否可通行
    isWalkable(row, col) {
        const tileType = this.getTileType(row, col);
        return tileType === 0 || tileType === 3; // 空地或草地可通行
    }

    // 检查位置是否可被摧毁
    isDestructible(row, col) {
        const tileType = this.getTileType(row, col);
        return tileType === 1; // 砖块可被摧毁
    }

    // 检查基地是否被摧毁
    isBaseDestroyed() {
        const baseCenterR = 22;
        const baseCenterC = 12;
        
        for (let r = baseCenterR; r < baseCenterR + 2; r++) {
            for (let c = baseCenterC; c < baseCenterC + 2; c++) {
                if (this.getTileType(r, c) === 6) {
                    return false;
                }
            }
        }
        
        this.baseDestroyed = true;
        return true;
    }

    // 生成敌人
    spawnEnemy() {
        if (this.enemiesSpawned < this.config.totalEnemies) {
            this.enemiesSpawned++;
            return true;
        }
        return false;
    }

    // 敌人被摧毁
    enemyDestroyed() {
        this.enemiesDestroyed++;
    }

    // 获取剩余敌人数量
    getRemainingEnemies() {
        return this.config.totalEnemies - this.enemiesDestroyed;
    }

    // 检查关卡是否完成
    isLevelComplete() {
        return this.enemiesSpawned >= this.config.totalEnemies && 
               this.getRemainingEnemies() === 0;
    }

    // 添加道具效果
    addEffect(type, duration) {
        this.activeEffects[type] = duration;
    }

    // 更新道具效果
    updateEffects(deltaTime) {
        Object.keys(this.activeEffects).forEach(key => {
            if (this.activeEffects[key] > 0) {
                this.activeEffects[key] -= deltaTime;
                if (this.activeEffects[key] <= 0) {
                    this.activeEffects[key] = 0;
                }
            }
        });
    }

    // 收集道具
    collectBonus(bonusType) {
        this.bonusesCollected.push({
            type: bonusType,
            time: Date.now()
        });
    }

    // 增加分数
    addScore(points) {
        this.score += points;
    }

    // 减少生命值
    loseLife() {
        this.lives--;
        return this.lives;
    }

    // 增加生命值
    addLife() {
        this.lives++;
    }

    // 下一关
    nextLevel() {
        this.level++;
    }

    // 设置关卡
    setLevel(levelNumber) {
        this.level = levelNumber;
    }

    // 获取关卡统计信息
    getStats() {
        return {
            level: this.level,
            lives: this.lives,
            score: this.score,
            enemiesSpawned: this.enemiesSpawned,
            enemiesDestroyed: this.enemiesDestroyed,
            tilesDestroyed: this.tilesDestroyed,
            bonusesCollected: this.bonusesCollected.length
        };
    }

    // 重置关卡数据（用于重新开始）
    reset() {
        if (this.config) {
            this.currentMap = [...this.config.map];
        }
        this.level = 1;
        this.lives = 3;
        this.score = 0;
        this.enemiesSpawned = 0;
        this.enemiesDestroyed = 0;
        this.baseDestroyed = false;
        this.activeEffects = { stop: 0, shield: 0, star: 0 };
        this.bonusesCollected = [];
        this.tilesDestroyed = 0;
    }
} 