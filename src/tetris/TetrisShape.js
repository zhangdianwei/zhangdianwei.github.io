
export const TetrisShapeType = {
    I: 'I',
    J: 'J',
    L: 'L',
    O: 'O',
    S: 'S',
    T: 'T',
    Z: 'Z',
};

export function getRandomShapeType() {
    const shapeTypes = Object.values(TetrisShapeType);
    return shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
}

export function getRandomColorIndex() {
    return Math.floor(Math.random() * 5);
}

export const TetrisShapeDef = {
    'I': {
        tiles: [
            [1, 1, 1, 1],
        ],
    },
    'J': {
        tiles: [
            [1, 0, 0],
            [1, 1, 1],
        ],
    },
    'L': {
        tiles: [
            [0, 0, 1],
            [1, 1, 1],
        ],
    },
    'O': {
        tiles: [
            [1, 1],
            [1, 1],
        ],
    },
    'S': {
        tiles: [
            [0, 1, 1],
            [1, 1, 0],
        ],
    },
    'T': {
        tiles: [
            [0, 1, 0],
            [1, 1, 1],
        ],
    },
    'Z': {
        tiles: [
            [1, 1, 0],
            [0, 1, 1],
        ],
    },
}