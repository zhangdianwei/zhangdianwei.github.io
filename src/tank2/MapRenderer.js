import * as PIXI from 'pixi.js';
import { TankApp } from './TankApp.js';

export default class MapRenderer {
    constructor() {
        this.tankApp = TankApp.instance;
        this.tileSize = 32;
        this.mapWidth = 26;
        this.mapHeight = 24;
    }
    
    renderMap() {
        const levelData = this.tankApp.levelData;
        const renderLayers = this.tankApp.renderLayers;
        
        // 清除现有地图
        this.clearMap();
        
        // 渲染地图
        for (let r = 0; r < this.mapHeight; r++) {
            for (let c = 0; c < this.mapWidth; c++) {
                const tileType = levelData.getTileType(r, c);
                
                if (tileType > 0) {
                    this.renderTile(r, c, tileType);
                }
            }
        }
    }
    
    clearMap() {
        const renderLayers = this.tankApp.renderLayers;
        renderLayers.tiles.removeChildren();
        renderLayers.grass.removeChildren();
    }
    
    renderTile(row, col, tileType) {
        const renderLayers = this.tankApp.renderLayers;
        const textures = this.tankApp.textures;
        
        const x = col * this.tileSize;
        const y = row * this.tileSize;
        
        let layer = renderLayers.tiles;
        let textureName = '';
        
        switch (tileType) {
            case 1: textureName = 'tank2/bigtile_1_tile_1.png'; break; // 砖块
            case 2: textureName = 'tank2/bigtile_2_tile_1.png'; break; // 铁块
            case 3: 
                textureName = 'tank2/bigtile_3_tile_1.png'; 
                layer = renderLayers.grass; // 草地
                break;
            case 4: textureName = 'tank2/bigtile_4_tile_1.png'; break; // 水面
            case 6: textureName = 'tank2/bigtile_6.png'; break; // 基地
        }
        
        if (textureName && textures[textureName]) {
            const sprite = new PIXI.Sprite(textures[textureName]);
            sprite.x = x;
            sprite.y = y;
            layer.addChild(sprite);
        }
    }
    
    destroyTile(row, col) {
        const renderLayers = this.tankApp.renderLayers;
        const x = col * this.tileSize;
        const y = row * this.tileSize;
        
        // 清除对应位置的精灵
        [renderLayers.tiles, renderLayers.grass].forEach(layer => {
            for (let i = layer.children.length - 1; i >= 0; i--) {
                const child = layer.children[i];
                if (child.x === x && child.y === y) {
                    layer.removeChild(child);
                }
            }
        });
    }
    
    worldToGrid(worldX, worldY) {
        const col = Math.floor(worldX / this.tileSize);
        const row = Math.floor(worldY / this.tileSize);
        return { row, col };
    }
    
    gridToWorld(row, col) {
        const x = col * this.tileSize;
        const y = row * this.tileSize;
        return { x, y };
    }
} 