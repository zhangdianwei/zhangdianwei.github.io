import * as PIXI from 'pixi.js';
import TankTile from './TankTile.js';
import TankBase from './TankBase.js';
import allLevels from './level/levels.json' with { type: 'json' };
import { TileType, Dir, TileSize, TankType, MapWidth, MapHeight } from './TileType.js';

export default class TankCompMap extends PIXI.Container {
    constructor(gameUI) {
        super();
        
        this.gameUI = gameUI;
        this.tankApp = gameUI.tankApp;
        this.textures = gameUI.textures;
        
        // === 地图配置 ===
        this.config = null;
        this.mapCols = 26;
        this.mapRows = 26;
        
        // === 瓦片管理 ===
        this.tiles = [];
        
        // === 渲染层引用 ===
        this.renderLayers = null;
    }
    
    setRenderLayers(renderLayers) {
        this.renderLayers = renderLayers;
    }
    
    update(deltaTime) {
        // 地图组件更新逻辑（如果需要的话）
        // 目前主要是静态的，不需要每帧更新
    }
    
    // === 关卡管理方法 ===
    
    startLevel() {
        this.loadLevel(this.gameUI.levelId);
    }
    
    loadLevel(levelId) {
        this.config = allLevels[levelId];
        this.initTilesFromMap(this.config.map);
        this.gameUI.createHome();
        this.gameUI.createPlayer();
        return true;
    }
    
    setLevel(levelId) {
        this.gameUI.levelId = levelId;
    }
    
    nextLevel() {
        this.gameUI.levelId++;
    }
    
    // === 游戏对象创建方法 ===
    
    initTilesFromMap(mapData) {
        this.clearAll();
        
        for (let r = 0; r < this.mapRows; r++) {
            this.tiles[r] = [];
            for (let c = 0; c < this.mapCols; c++) {
                const index = r * this.mapCols + c;
                const tileType = mapData[index] || TileType.EMPTY;
                
                if (tileType > TileType.EMPTY) {
                    const tile = new TankTile(r, c, tileType);
                    this.tiles[r][c] = tile;
                    this.addTileToRenderLayer(tile, tileType);
                } else {
                    this.tiles[r][c] = null;
                }
            }
        }
    }
    
    addTileToRenderLayer(tile, tileType) {
        const renderLayers = this.renderLayers;
        
        switch (tileType) {
            case TileType.BRICK:
            case TileType.IRON:
            case TileType.WATER:
                renderLayers.tiles.addChild(tile);
                break;
            case TileType.GRASS:
                renderLayers.grass.addChild(tile);
                break;
            case TileType.BASE:
                renderLayers.tiles.addChild(tile);
                break;
        }
    }
    
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
    
    clearAll() {
        // 清除瓦片
        this.clearTiles();
        
        // 清除玩家和基地（通过TankGameUI）
        if (this.gameUI.player) {
            if (this.gameUI.player.parent) {
                this.gameUI.player.parent.removeChild(this.gameUI.player);
            }
            this.gameUI.player = null;
        }
        
        if (this.gameUI.home) {
            if (this.gameUI.home.parent) {
                this.gameUI.home.parent.removeChild(this.gameUI.home);
            }
            this.gameUI.home = null;
        }
    }
    
    // === 重置方法 ===
    
    reset() {
        this.clearAll();
    }
    
    destroy() {
        this.clearAll();
        this.removeChildren();
        super.destroy();
    }
}
