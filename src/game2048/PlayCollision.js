// 通用碰撞检测与分裂逻辑
// 统一遍历所有cube，支持snake吃cube和snake断裂

function intersectsCircle(a, b) {
    const dx = a.centerX - b.centerX
    const dy = a.centerY - b.centerY
    const radius = a.radius + b.radius
    return dx * dx + dy * dy <= radius * radius
}

export function checkSnakeCollisions(playMgr) {
    const allSnakes = [playMgr.playerSnake, ...playMgr.enemySnakes]
    const collisions = new WeakMap()
    const getCollision = (cube) => {
        let collision = collisions.get(cube)
        if (!collision) {
            collision = cube.getCollision()
            collisions.set(cube, collision)
        }
        return collision
    }

    for (const snake of allSnakes) {
        if (!snake || !snake.head || snake.collisionCooldown > 0) continue
        const head = snake.head
        const headCollision = getCollision(head)
        const allCubes = getAllCubesExcludeSnake(playMgr, snake)
        for (const cube of allCubes) {
            if (intersectsCircle(headCollision, getCollision(cube))) {
                if (!cube.snake) {
                    if (head.level >= cube.level) {
                        snake.addCube(cube.level)
                        playMgr.removeObject(cube)
                        break
                    }
                    continue
                } else {
                    const parentSnake = cube.snake
                    const indexInSnake = parentSnake ? parentSnake.cubes.indexOf(cube) : -1
                    if (parentSnake && indexInSnake !== -1) {
                        if (head.level > cube.level) {
                            parentSnake.splitAt(indexInSnake)
                            if (snake === playMgr.playerSnake) playMgr.rewardBoost(20)
                        } else if (head.level < cube.level) {
                            snake.splitAt(0)
                        } else {
                            snake.bounceFrom(cube)
                            if (parentSnake.head) parentSnake.bounceFrom(head)
                            collisions.delete(head)
                            if (parentSnake.head) collisions.delete(parentSnake.head)
                        }
                    }
                }
                break
            }
        }
    }
}

function getAllCubesExcludeSnake(playMgr, excludedSnake) {
    const allCubes = []
    for (const cube of playMgr.looseCubes) {
        allCubes.push(cube)
    }
    for (const snake of [playMgr.playerSnake, ...playMgr.enemySnakes]) {
        if (snake === excludedSnake) continue
        for (let i = 0; i < snake.cubes.length; i++) {
            allCubes.push(snake.cubes[i])
        }
    }
    return allCubes
}
