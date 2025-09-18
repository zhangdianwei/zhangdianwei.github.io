/**
 * 瓦片类型枚举
 * 定义了坦克游戏中所有瓦片的类型
 */
export const TileType = {
    EMPTY: 0,      // 空地 - 可通行
    BRICK: 1,      // 砖块 - 可破坏，不可通行
    IRON: 2,       // 铁块 - 不可破坏，不可通行
    GRASS: 3,      // 草地 - 可通行，装饰层
    WATER: 4,      // 水面 - 不可通行
    NEST: 5,       // 预留
    BASE: 6        // 基地 - 需要保护的目标
};

/**
 * 方向枚举
 * 上/右/下/左 分别为 0/1/2/3
 */
export const Dir = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

/**
 * 获取瓦片类型名称
 * @param {number} type - 瓦片类型值
 * @returns {string} 瓦片类型名称
 */
export function getTileTypeName(type) {
    const typeNames = {
        [TileType.EMPTY]: '空地',
        [TileType.BRICK]: '砖块', 
        [TileType.IRON]: '铁块',
        [TileType.GRASS]: '草地',
        [TileType.WATER]: '水面',
        [TileType.NEST]: '老窝',
        [TileType.BASE]: '基地'
    };
    return typeNames[type] || '未知';
}

/**
 * 检查瓦片类型是否可通行
 * @param {number} type - 瓦片类型值
 * @returns {boolean} 是否可通行
 */
export function isWalkableTileType(type) {
    return type === TileType.EMPTY || type === TileType.GRASS;
}

/**
 * 检查瓦片类型是否可破坏
 * @param {number} type - 瓦片类型值
 * @returns {boolean} 是否可破坏
 */
export function isDestructibleTileType(type) {
    return type === TileType.BRICK;
}

/**
 * 检查瓦片类型是否是基地
 * @param {number} type - 瓦片类型值
 * @returns {boolean} 是否是基地
 */
export function isBaseTileType(type) {
    return type === TileType.BASE;
}