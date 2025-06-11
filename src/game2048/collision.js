// 通用碰撞检测与分裂逻辑
// 统一遍历所有cube，支持snake吃cube和snake断裂

/**
 * @param {PlayerSnake} playerSnake
 * @param {Array<EnermySnake>} enemySnakes
 * @param {Array<Cube>} looseCubes
 * @param {PIXI.Container} rootContainer
 */
export function checkSnakeCollisions(playerSnake, enemySnakes, looseCubes, rootContainer, app) {
    // 1. 收集所有snake对象
    const allSnakes = [playerSnake, ...enemySnakes];
    // 2. 收集所有cube及其归属
    const allCubes = [];
    // looseCubes
    for (const cube of looseCubes) {
        allCubes.push(cube);
    }
    // snake cubes
    for (const snake of allSnakes) {
        if (!snake || !snake.cubes) continue;
        for (let i = 0; i < snake.cubes.length; i++) {
            allCubes.push(snake.cubes[i]);
        }
    }
    // 3. 遍历所有snake的head，检测与所有cube的碰撞
    for (const snake of allSnakes) {
        if (!snake || !snake.head) continue;
        const head = snake.head;
        for (const cube of allCubes) {
            // 不检测自己头
            if (cube.snake === snake && snake.head === cube) continue;
            // 距离检测
            const dx = head.x - cube.x;
            const dy = head.y - cube.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = 32; // 以cube大小为基准
            if (dist < minDist) {
                // 1. 吃掉cube（loose 或 其他snake的body）
                if (!cube.snake) { // looseCube
                    if (head.currentValue >= cube.currentValue) {
                        // snake吃掉looseCube
                        snake.addCube(cube.currentValue);
                        if (rootContainer && cube.parent) rootContainer.removeChild(cube);
                        const idx = looseCubes.indexOf(cube);
                        if (idx !== -1) looseCubes.splice(idx, 1);
                        break;
                    }
                } else { // snakeCube
                    // 不能自己吃自己
                    if (cube.snake === snake) continue;
                    // 头碰body：断裂
                    const parentSnake = cube.snake;
                    const indexInSnake = parentSnake ? parentSnake.cubes.indexOf(cube) : -1;
                    if (parentSnake && indexInSnake !== -1) {
                        splitSnakeAt(parentSnake, indexInSnake, looseCubes, rootContainer);
                        // 如果断的是head，则整个snake消失
                        if (indexInSnake === 0) {
                            parentSnake.removeSelfFromGame(rootContainer, enemySnakes, app);
                        }
                    }
                    break;
                }
            }
        }
    }
}

function splitSnakeAt(snake, index, looseCubes, rootContainer) {
    const removed = snake.cubes.splice(index);
    for (const cube of removed) {
        if (cube.parent) cube.parent.removeChild(cube);
        cube.snake = null;
        looseCubes.push(cube);
        if (rootContainer) rootContainer.addChild(cube);
    }
}
