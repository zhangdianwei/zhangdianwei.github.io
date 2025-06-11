// 通用碰撞检测与分裂逻辑
// 统一遍历所有cube，支持snake吃cube和snake断裂

/**
 * 通用碰撞检测与分裂逻辑，直接通过gameApp getter访问所有对象
 * @param {GameApp} gameApp
 */
import { GameApp } from './GameApp.js';

export function checkSnakeCollisions() {
    const gameApp = GameApp.instance;
    // 1. 收集所有snake对象
    const allSnakes = [gameApp.playerSnake, ...gameApp.enemySnakes];
    // 2. 收集所有cube及其归属
    const allCubes = [];
    // looseCubes
    for (const cube of gameApp.looseCubes) {
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
            if (cube.snake === snake && snake.head === cube) continue;
            const dx = head.x - cube.x;
            const dy = head.y - cube.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = cube.getSize() / 2;
            if (dist < minDist) {
                if (!cube.snake) {
                    if (head.currentValue >= cube.currentValue) {
                        snake.addCube(cube.currentValue);
                        gameApp.removeGameObject(cube);
                        break;
                    }
                } else {
                    if (cube.snake === snake) continue;
                    const parentSnake = cube.snake;
                    const indexInSnake = parentSnake ? parentSnake.cubes.indexOf(cube) : -1;
                    if (parentSnake && indexInSnake !== -1) {
                        parentSnake.splitAt(indexInSnake);
                    }
                    break;
                }
            }
        }
    }
}

