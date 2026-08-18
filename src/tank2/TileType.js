export const TileType = {
    EMPTY: 0,
    BRICK: 1,
    IRON: 2,
    GRASS: 3,
    WATER: 4,
};

export const Dir = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

export const TileSize = 24;
export const MapRows = 26;
export const MapCols = 26;
export const MapWidth = MapCols * TileSize;
export const MapHeight = MapRows * TileSize;
export const TankSize = TileSize * 2;
export const TankBoundaryThreshold = 2;
export const TankPositionStep = TileSize / 2;

export const TankType = {
    PLAYER: 0,
    ENEMY_1: 1,
    ENEMY_2: 2,
    ENEMY_3: 3,
    ENEMY_4: 4
};

export const BulletLevelConfig = {
    1: { brickDamage: 1, speed: 300, breaksIron: false },
    2: { brickDamage: 2, speed: 420, breaksIron: false },
    3: { brickDamage: 2, speed: 420, breaksIron: true }
};

export const TankConfig = {
    [TankType.PLAYER]: {
        speed: 110,
        health: 1,
        power: 1,
        bulletLevel: 1
    },
    [TankType.ENEMY_1]: {
        speed: 80,
        health: 1,
        power: 1,
        bulletLevel: 1,
        bulletSpeed: 270
    },
    [TankType.ENEMY_2]: {
        speed: 140,
        health: 1,
        power: 1,
        bulletLevel: 1,
        bulletSpeed: 270
    },
    [TankType.ENEMY_3]: {
        speed: 100,
        health: 1,
        power: 1,
        bulletLevel: 1,
        bulletSpeed: 400
    },
    [TankType.ENEMY_4]: {
        speed: 70,
        health: 4,
        power: 1,
        bulletLevel: 1,
        bulletSpeed: 300
    }
};

export function moveByDir(obj, dir, distance) {
    switch (dir) {
        case Dir.UP:
            obj.y -= distance;
            break;
        case Dir.DOWN:
            obj.y += distance;
            break;
        case Dir.LEFT:
            obj.x -= distance;
            break;
        case Dir.RIGHT:
            obj.x += distance;
            break;
    }
}
