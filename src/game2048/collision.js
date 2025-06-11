// 通用碰撞检测与分裂逻辑
// 统一遍历所有cube，支持snake吃cube和snake断裂

/**
 * 通用碰撞检测与分裂逻辑，直接通过gameApp getter访问所有对象
 * @param {GameApp} gameApp
 */
import { GameApp } from './GameApp.js';

export function checkSnakeCollisions() {
    const gameApp = GameApp.instance;

    const allSnakes = [gameApp.playerSnake, ...gameApp.enemySnakes];

    for (const snake of allSnakes) {
        if (!snake || !snake.head) continue;
        const head = snake.head;
        const allCubes = getAllCubesExcludeSnake(snake);
        for (const cube of allCubes) {
            const dx = head.x - cube.x;
            const dy = head.y - cube.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = cube.getSize() / 2;
            if (dist < minDist) {
                if (!cube.snake) {
                    // 普通吃散块
                    if (head.currentValue >= cube.currentValue) {
                        snake.addCube(cube.currentValue);
                        gameApp.removeGameObject(cube);
                        break;
                    }
                } else {
                    // snake撞snake
                    const parentSnake = cube.snake;
                    const indexInSnake = parentSnake ? parentSnake.cubes.indexOf(cube) : -1;
                    if (parentSnake && indexInSnake !== -1) {
                        // 无论撞到哪一节，都按head与cube的currentValue比较
                        if (head.currentValue > cube.currentValue) {
                            parentSnake.splitAt(indexInSnake);
                        } else if (head.currentValue < cube.currentValue) {
                            snake.splitAt(0);
                        } else {
                            // 相等时，playerSnake占优势
                            if (snake === gameApp.playerSnake) {
                                parentSnake.splitAt(indexInSnake);
                            } else {
                                snake.splitAt(0);
                            }
                        }
                    }
                }
                break;
            }
        }
    }

}

function getAllCubesExcludeSnake(excludedSnake) {
    const gameApp = GameApp.instance;
    const allCubes = [];
    for (const cube of gameApp.looseCubes) {
        allCubes.push(cube);
    }
    for (const snake of gameApp.enemySnakes) {
        if (snake === excludedSnake) continue;
        for (let i = 0; i < snake.cubes.length; i++) {
            allCubes.push(snake.cubes[i]);
        }
    }
    return allCubes;
}