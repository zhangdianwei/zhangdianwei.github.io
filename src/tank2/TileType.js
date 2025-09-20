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

export const TileSize = 32; //每个小格子大小
export const MapRows = 26;
export const MapCols = 26;
export const MapWidth = MapCols * TileSize;
export const MapHeight = MapRows * TileSize;

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