import TankTile from './TankTile.js';
import Player from './Player.js';
import { TankApp } from './TankApp.js';
import allLevels from './level/levels.json' with { type: 'json' };
import * as PIXI from 'pixi.js';
import { TileType } from './TileType.js';

export default class TankLevelData {
    constructor() {
        this.tankApp = TankApp.instance;
        
        // === 基础属性 ===
        this.levelId = 0;
        this.lives = 3;
        this.score = 0;
        
        // === 地图配置 ===
        this.config = null;
        this.mapWidth = 26;
        this.mapHeight = 26;
        this.tileSize = 32;
        
        // === 瓦片管理 ===
        this.tiles = [];
        
        // === 游戏对象 ===
        this.player = null;
        this.home = null;
        
        // === 敌人状态 ===
        this.enemiesSpawned = 0;
        this.enemiesDestroyed = 0;
        
        // === 游戏状态 ===
        this.baseDestroyed = false;
        
        // === 道具效果 ===
        this.activeEffects = {
            stop: 0,    // 停止效果
            shield: 0,  // 护盾效果
            star: 0     // 星星效果
        };
        
        // === 统计信息 ===
        this.bonusesCollected = [];
        this.tilesDestroyed = 0;
    }

    // === 关卡管理方法 ===

    startLevel(){
        this.loadLevel(this.levelId);
    }
    
    // 加载关卡配置
    loadLevel(levelId) {
        const levelConfig = allLevels[levelId];
        this.config = levelConfig;
        this.createTilesFromMap(levelConfig.map);
        this.createHome();
        this.createPlayer();
        return true;
    }

    // 设置关卡
    setLevel(levelId) {
        this.levelId = levelId;
    }

    // 下一关
    nextLevel() {
        this.levelId++;
    }

    // === 游戏对象创建方法 ===
    
    // 创建玩家坦克
    createPlayer() {
        // 清除现有玩家
        if (this.player) {
            if (this.player.parent) {
                this.player.parent.removeChild(this.player);
            }
        }
        
        this.player = new Player();
        this.tankApp.player = this.player;
        this.tankApp.renderLayers.tank.addChild(this.player);
        
        // 设置玩家初始位置（基地左边3个格子）
        const baseRow = this.mapHeight - 1;
        const baseCol = this.mapWidth / 2 - 1;  // 基地的左上角列位置
        const playerRow = baseRow;              // 与基地同一行
        const playerCol = baseCol - 3;          // 基地左边3个格子
        this.player.x = playerCol * this.tileSize + this.tileSize / 2;
        this.player.y = playerRow * this.tileSize + this.tileSize / 2;
        
        this.player.spawn();
    }
    
    // 创建基地（老窝）
    createHome() {
        // 清除现有基地
        if (this.home) {
            if (this.home.parent) {
                this.home.parent.removeChild(this.home);
            }
        }
        
        // 基地固定创建在最下面一行的中心
        const homeRow = this.mapHeight - 1;
        const homeCol = this.mapWidth / 2 - 1;
        
        // 创建基地（使用一张2x2的大图）
        this.home = new PIXI.Sprite(this.tankApp.textures['tank2/bigtile_6.png']);
        this.home.width = this.tileSize * 2;  // 宽度为2个tile
        this.home.height = this.tileSize * 2; // 高度为2个tile
        this.home.anchor.set(0, 0);
        
        // 设置位置（左上角对齐到第一个tile位置）
        this.home.x = homeCol * this.tileSize;
        this.home.y = (homeRow - 1) * this.tileSize; // 从上一行开始，因为要占2行
        
        // 添加到tank渲染层（而不是tiles层）
        this.tankApp.renderLayers.tank.addChild(this.home);
    }

    // 根据地图数据创建瓦片对象
    createTilesFromMap(mapData) {
        this.clearAll();
        
        for (let r = 0; r < this.mapHeight; r++) {
            this.tiles[r] = [];
            for (let c = 0; c < this.mapWidth; c++) {
                const index = r * this.mapWidth + c;
                const tileType = mapData[index] || TileType.EMPTY;
                
                if (tileType > TileType.EMPTY) {
                    const tile = new TankTile(r, c, tileType);
                    this.tiles[r][c] = tile;
                    
                    // 添加到对应的渲染层
                    this.addTileToRenderLayer(tile, tileType);
                } else {
                    this.tiles[r][c] = null;
                }
            }
        }
    }

    // 添加瓦片到渲染层
    addTileToRenderLayer(tile, tileType) {
        const renderLayers = this.tankApp.renderLayers;
        
        switch (tileType) {
            case TileType.BRICK: // 砖块
            case TileType.IRON: // 铁块
            case TileType.WATER: // 水面
            case TileType.BASE: // 基地
                renderLayers.tiles.addChild(tile);
                break;
            case TileType.GRASS: // 草地
                renderLayers.grass.addChild(tile);
                break;
            case TileType.NEST: // 老窝
                renderLayers.tiles.addChild(tile);
                break;
        }
    }

    // 清除所有瓦片
    clearTiles() {
        this.tiles.forEach(row => {
            if (row) {
                row.forEach(tile => {
                    if (tile && tile.parent) {
                        tile.parent.removeChild(tile);
                    }
                });
            }
        });
        this.tiles = [];
    }

    // 清除所有游戏对象（瓦片、玩家、基地）
    clearAll() {
        // 清除瓦片
        this.clearTiles();
        
        // 清除玩家
        if (this.player) {
            if (this.player.parent) {
                this.player.parent.removeChild(this.player);
            }
            this.player = null;
            this.tankApp.player = null;
        }
        
        // 清除基地
        if (this.home) {
            if (this.home.parent) {
                this.home.parent.removeChild(this.home);
            }
            this.home = null;
        }
    }

    // === 地图查询方法 ===
    
    // 获取指定位置的瓦片类型
    getTileType(row, col) {
        if (row >= 0 && row < this.mapHeight && col >= 0 && col < this.mapWidth) {
            const tile = this.tiles[row] && this.tiles[row][col];
            if (tile) {
                // 如果是home的特殊标记，返回基地类型
                if (tile.isHome) {
                    return tile.type;
                }
                // 如果是TankTile对象，返回其类型
                return tile.type;
            }
        }
        return TileType.EMPTY;
    }

    // 设置指定位置的瓦片类型
    setTileType(row, col, type) {
        if (row >= 0 && row < this.mapHeight && col >= 0 && col < this.mapWidth) {
            if (type === TileType.EMPTY) {
                // 移除瓦片
                if (this.tiles[row] && this.tiles[row][col]) {
                    const tile = this.tiles[row][col];
                    if (tile.parent) {
                        tile.parent.removeChild(tile);
                    }
                    this.tiles[row][col] = null;
                    this.tilesDestroyed++;
                }
            } else {
                // 创建或更新瓦片
                if (!this.tiles[row]) {
                    this.tiles[row] = [];
                }
                
                if (this.tiles[row][col]) {
                    // 更新现有瓦片
                    this.tiles[row][col].setType(type);
                } else {
                    // 创建新瓦片
                    const tile = new TankTile(row, col, type);
                    this.tiles[row][col] = tile;
                    this.addTileToRenderLayer(tile, type);
                }
            }
        }
    }

    // 检查位置是否可通行
    isWalkable(worldX, worldY) {
        const col = Math.floor(worldX / this.tileSize);
        const row = Math.floor(worldY / this.tileSize);
        const tileType = this.getTileType(row, col);
        return tileType === TileType.EMPTY || tileType === TileType.GRASS; // 空地或草地可通行
    }

    // 检查位置是否可被摧毁
    isDestructible(row, col) {
        const tileType = this.getTileType(row, col);
        return tileType === TileType.BRICK; // 砖块可被摧毁
    }

    // 检查基地是否被摧毁
    isBaseDestroyed() {
        // 直接检查home对象是否还存在于渲染层中
        if (this.home && this.home.parent) {
            return false;
        }
        
        this.baseDestroyed = true;
        return true;
    }
    
    // 摧毁基地（被子弹击中时调用）
    destroyBase() {
        if (this.home && this.home.parent) {
            this.home.parent.removeChild(this.home);
        }
        this.baseDestroyed = true;
    }
    
    // 检查基地碰撞（子弹与基地的碰撞检测）
    checkBaseCollision(x, y) {
        if (!this.home || !this.home.parent) {
            return false;
        }
        
        // 检查点是否在基地范围内
        const homeLeft = this.home.x;
        const homeRight = this.home.x + this.home.width;
        const homeTop = this.home.y;
        const homeBottom = this.home.y + this.home.height;
        
        return x >= homeLeft && x <= homeRight && y >= homeTop && y <= homeBottom;
    }
    
    // 世界坐标转换为网格坐标
    worldToGrid(worldX, worldY) {
        const col = Math.floor(worldX / this.tileSize);
        const row = Math.floor(worldY / this.tileSize);
        return { row, col };
    }

    // === 敌人管理方法 ===
    
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

    // === 道具效果管理方法 ===
    
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

    // === 游戏状态管理方法 ===
    
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

    // === 统计信息方法 ===
    
    // 获取关卡统计信息
    getStats() {
        return {
            level: this.levelId,
            lives: this.lives,
            score: this.score,
            enemiesSpawned: this.enemiesSpawned,
            enemiesDestroyed: this.enemiesDestroyed,
            tilesDestroyed: this.tilesDestroyed,
            bonusesCollected: this.bonusesCollected.length
        };
    }

    // === 重置方法 ===
    
    // 重置关卡数据（用于重新开始）
    reset() {
        if (this.config) {
            this.createTilesFromMap(this.config.map);
            this.createHome();
            this.createPlayer();
        }
        this.levelId = 1;
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