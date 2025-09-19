export const TileType = {
    EMPTY: 0,
    BRICK: 1,
    IRON: 2,
    GRASS: 3,
    WATER: 4,
    BASE: 6
};

export const Dir = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

export function getTileTypeName(type) {
    const typeNames = {
        [TileType.EMPTY]: '空地',
        [TileType.BRICK]: '砖块', 
        [TileType.IRON]: '铁块',
        [TileType.GRASS]: '草地',
        [TileType.WATER]: '水面',
        [TileType.BASE]: '老窝',
        [TileType.BASE]: '基地'
    };
    return typeNames[type] || '未知';
}

export function isWalkableTileType(type) {
    return type === TileType.EMPTY || type === TileType.GRASS;
}

export function isDestructibleTileType(type) {
    return type === TileType.BRICK;
}

export function isBaseTileType(type) {
    return type === TileType.BASE;
}

export const TileSize = 32; //每个小格子大小