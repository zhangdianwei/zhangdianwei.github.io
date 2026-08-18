import PlayTile from './PlayTile.js'
import allLevels from './level/levels.json' with { type: 'json' }
import { MapCols, MapRows, TileSize, TileType } from './TileType.js'

export default class PlayMap {
    constructor(dialog) {
        this.dialog = dialog;
        this.app = dialog.app;

        // === 地图配置 ===
        this.config = null;
        this.mapCols = MapCols;
        this.mapRows = MapRows;

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
                    const tile = new PlayTile(this.dialog, r, c, tileType);
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
                    const tile = new PlayTile(this.dialog, row, col, type);
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

    isRectWalkable(cx, cy, halfSize = TileSize) {
        const { rowStart, rowEnd, colStart, colEnd } = this.getOccupiedGridRange({
            x: cx,
            y: cy,
            width: halfSize * 2,
            height: halfSize * 2,
        });
        for (let r = rowStart; r <= rowEnd; r++) {
            for (let c = colStart; c <= colEnd; c++) {
                if (!this.passable(r, c)) return false;
            }
        }
        return true;
    }

    getMovableDistance(bounds, direction) {
        const range = this.getOccupiedGridRange(bounds);
        const left = bounds.x - bounds.width / 2;
        const right = bounds.x + bounds.width / 2;
        const top = bounds.y - bounds.height / 2;
        const bottom = bounds.y + bounds.height / 2;
        let distance = Infinity;

        if (direction === 0 || direction === 2) {
            for (let col = range.colStart; col <= range.colEnd; col++) {
                let row = direction === 0 ? range.rowStart - 1 : range.rowEnd + 1;
                while (this.passable(row, col)) row += direction === 0 ? -1 : 1;
                const next = direction === 0
                    ? top - (row + 1) * TileSize
                    : row * TileSize - bottom;
                distance = Math.min(distance, next);
            }
        } else {
            for (let row = range.rowStart; row <= range.rowEnd; row++) {
                let col = direction === 3 ? range.colStart - 1 : range.colEnd + 1;
                while (this.passable(row, col)) col += direction === 3 ? -1 : 1;
                const next = direction === 3
                    ? left - (col + 1) * TileSize
                    : col * TileSize - right;
                distance = Math.min(distance, next);
            }
        }

        return Math.max(0, distance);
    }

    passable(row, col) {
        if (row < 0 || row >= this.mapRows || col < 0 || col >= this.mapCols) {
            return false;
        }
        const t = this.getTileType(row, col);
        return t === TileType.EMPTY || t === TileType.GRASS;
    }

    getOccupiedGridRange(bounds) {
        const left = bounds.x - bounds.width / 2;
        const right = bounds.x + bounds.width / 2;
        const top = bounds.y - bounds.height / 2;
        const bottom = bounds.y + bounds.height / 2;
        return {
            rowStart: Math.floor(top / TileSize),
            rowEnd: Math.ceil(bottom / TileSize) - 1,
            colStart: Math.floor(left / TileSize),
            colEnd: Math.ceil(right / TileSize) - 1,
        };
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
        const endRow = Math.ceil(bottom / TileSize) - 1;
        const startCol = Math.floor(left / TileSize);
        const endCol = Math.ceil(right / TileSize) - 1;

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

        const bounds = bullet.getBounds();
        const rcs = this.findRCsInBounds(bounds);
        let hit = false;
        for (let i = 0; i < rcs.length; i++) {
            const rc = rcs[i];
            const tile = this.tiles[rc.row][rc.col];
            if (!tile) continue;

            if (tile.type === TileType.BRICK) {
                tile.setBlood(tile.getBlood() - bullet.getBrickDamage());
                if (tile.getBlood() <= 0) {
                    this.setTileType(rc.row, rc.col, TileType.EMPTY);
                }
                hit = true;
            }
            else if (tile.type === TileType.IRON) {
                if (bullet.canBreakIron()) {
                    this.setTileType(rc.row, rc.col, TileType.EMPTY);
                }
                hit = true;
            }
        }
        if (hit) bullet.hit();
    }
}
