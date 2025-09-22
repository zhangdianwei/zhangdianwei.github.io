import TankTile from './TankTile.js';
import allLevels from './level/levels.json' with { type: 'json' };
import { TileType, TileSize } from './TileType.js';

export default class TankCompMap {
    constructor(gameUI) {
        
        this.gameUI = gameUI;
        this.tankApp = gameUI.tankApp;
        this.textures = gameUI.textures;
        
        // === 地图配置 ===
        this.config = null;
        this.mapCols = 26;
        this.mapRows = 26;
        
        this.tiles = [];

        this.renderLayers = null;
    }
    
    setRenderLayers(renderLayers) {
        this.renderLayers = renderLayers;
    }
    
    loadLevel(levelId) {
        this.config = allLevels[levelId];
        this.initTilesFromMap(this.config.map);
        return true;
    }
    
    initTilesFromMap(mapData) {
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
    
    // 获取指定位置的瓦片类型
    getTileType(row, col) {
        if (row >= 0 && row < this.mapRows && col >= 0 && col < this.mapCols) {
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
        if (row >= 0 && row < this.mapRows && col >= 0 && col < this.mapCols) {
            if (type === TileType.EMPTY) {
                // 移除瓦片
                if (this.tiles[row] && this.tiles[row][col]) {
                    const tile = this.tiles[row][col];
                    if (tile.parent) {
                        tile.parent.removeChild(tile);
                    }
                    this.tiles[row][col] = null;
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
        const col = Math.floor(worldX / TileSize);
        const row = Math.floor(worldY / TileSize);
        const tileType = this.getTileType(row, col);
        return tileType === TileType.EMPTY || tileType === TileType.GRASS; // 空地或草地可通行
    }

    isRectWalkable(cx, cy, halfSize = 16) {
        const left = cx - halfSize;
        const right = cx + halfSize - 1;
        const top = cy - halfSize;
        const bottom = cy + halfSize - 1;
        const colStart = Math.floor(left / TileSize);
        const colEnd = Math.floor(right / TileSize);
        const rowStart = Math.floor(top / TileSize);
        const rowEnd = Math.floor(bottom / TileSize);
        for (let r = rowStart; r <= rowEnd; r++) {
            for (let c = colStart; c <= colEnd; c++) {
                const t = this.getTileType(r, c);
                if (!(t === TileType.EMPTY || t === TileType.GRASS)) {
                    return false;
                }
            }
        }
        return true;
    }

    getMovableDistance(bounds, direction) {
        const centerX = bounds.x;
        const centerY = bounds.y;
        const width = bounds.width;
        const height = bounds.height;
        
        let t = 4;
        const srcPoses = [
            { x: centerX - width/2, y: centerY - height/2 },
            { x: centerX + width/2, y: centerY - height/2 },
            { x: centerX - width/2, y: centerY + height/2 },
            { x: centerX + width/2, y: centerY + height/2 }
        ]
        const thresPoses = [
            { x: centerX - width/2 + t, y: centerY - height/2 + t },
            { x: centerX + width/2 - t, y: centerY - height/2 + t },
            { x: centerX - width/2 + t, y: centerY + height/2 - t },
            { x: centerX + width/2 - t, y: centerY + height/2 - t }
        ];
        const standRCs = thresPoses.map(p => this.worldToGrid(p.x, p.y));
        const nextRCs = standRCs.map(rc => this.findNextNotWalkRC(rc, direction));
        const nextPoses = nextRCs.map(rc => this.gridToWorld(rc.row, rc.col));
        const diffs = [];
        for (let i = 0; i < srcPoses.length; i++) {
            if (direction === 0) diffs.push(srcPoses[i].y - (nextPoses[i].y + TileSize));
            else if (direction === 1) diffs.push(nextPoses[i].x - srcPoses[i].x);
            else if (direction === 2) diffs.push(nextPoses[i].y - srcPoses[i].y);
            else diffs.push(srcPoses[i].x - (nextPoses[i].x + TileSize));
        }
        return Math.min(...diffs);
    }

    findNextCanWalkRC(rc, direction) {
        let r = rc.row;
        let c = rc.col;
        const passable = (row, col) => {
            const t = this.getTileType(row, col);
            return t === TileType.EMPTY || t === TileType.GRASS;
        };
        
        if (direction === 0) {
            // 向上移动，从当前位置开始搜索
            while (r - 1 >= 0 && passable(r - 1, c)) r--;
            return { row: r, col: c };
        }
        if (direction === 2) {
            // 向下移动，从当前位置开始搜索
            while (r + 1 < this.mapRows && passable(r + 1, c)) r++;
            return { row: r, col: c };
        }
        if (direction === 1) {
            // 向右移动，从当前位置开始搜索
            while (c + 1 < this.mapCols && passable(r, c + 1)) c++;
            return { row: r, col: c };
        }
        // 向左移动，从当前位置开始搜索
        while (c - 1 >= 0 && passable(r, c - 1)) c--;
        return { row: r, col: c };
    }

    passable(row, col) {
        if (row < 0 || row >= this.mapRows || col < 0 || col >= this.mapCols) {
            return false;
        }
        const t = this.getTileType(row, col);
        return t === TileType.EMPTY || t === TileType.GRASS;
    }

    findNextNotWalkRC(rc, direction) {
        let r = rc.row;
        let c = rc.col;
        
        if (direction === 0) {
            // 向上移动，从当前位置开始搜索
            while (this.passable(r, c)) r--;
            return { row: r, col: c };
        }
        if (direction === 2) {
            // 向下移动，从当前位置开始搜索
            while (this.passable(r, c)) r++;
            return { row: r, col: c };
        }
        if (direction === 1) {
            // 向右移动，从当前位置开始搜索
            while (this.passable(r, c)) c++;
            return { row: r, col: c };
        }
        // 向左移动，从当前位置开始搜索
        while (this.passable(r, c)) c--;
        return { row: r, col: c };
    }
    
    // 世界坐标转换为网格坐标
    worldToGrid(worldX, worldY) {
        const col = Math.floor(worldX / TileSize);
        const row = Math.floor(worldY / TileSize);
        return { row, col };
    }

    gridToWorld(row, col) {
        return { x: col * TileSize, y: row * TileSize };
    }

    findRCsInBounds(bounds) {
        const rcs = [];
        const left = bounds.x - bounds.width / 2;
        const top = bounds.y - bounds.height / 2;
        const right = bounds.x + bounds.width / 2;
        const bottom = bounds.y + bounds.height / 2;
        
        const startRow = Math.floor(top / TileSize);
        const endRow = Math.floor(bottom / TileSize);
        const startCol = Math.floor(left / TileSize);
        const endCol = Math.floor(right / TileSize);
        
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (row >= 0 && row < this.mapRows && col >= 0 && col < this.mapCols) {
                    rcs.push({ row, col });
                }
            }
        }

        return rcs;
    }

    checkCollisionBullet(bullet) {
        if (bullet.isDead) return;

        let bounds = bullet.getBounds();
        let rcs = this.findRCsInBounds(bounds);
        for (let i = 0; i < rcs.length; i++) {
            let rc = rcs[i];
            let tile = this.tiles[rc.row][rc.col];
            if (!tile) continue;

            if (tile.type === TileType.BRICK) {
                tile.setBlood(tile.getBlood() - bullet.getPower());
                if (tile.getBlood() <= 0) {
                    this.setTileType(rc.row, rc.col, TileType.EMPTY);
                }
                bullet.makeDead();
            }
            else if (tile.type === TileType.IRON) {
                if (bullet.getPower() >= 2) {
                    this.setTileType(rc.row, rc.col, TileType.EMPTY);
                }
                bullet.makeDead();
            }
        }
    }
}
