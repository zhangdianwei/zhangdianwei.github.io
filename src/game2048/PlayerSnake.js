import * as PIXI from 'pixi.js';
import {GameApp} from './GameApp.js';
import Snake from './Snake.js';
// Cube class is implicitly used by Snake, but not directly instantiated here typically

export default class PlayerSnake extends Snake {
    /**
     * @param {number} initialValue - 蛇头Cube的初始数值
     * @param {number} segmentLength - 蛇段之间的期望长度
     */
    constructor(initialValue = 2, segmentLength = 30, playerSpeed = 5) {
        // Call Snake constructor: initialCubesData, segmentLength, speed
        super([{ value: initialValue, x: 0, y: 0 }], segmentLength, playerSpeed);

        this.gameApp = GameApp.instance;
        if (!this.gameApp) {
            console.error('GameApp instance is not available for PlayerSnake.');
            // Consider throwing an error or handling this more robustly
        }
        // this.speed is now inherited from Snake and set by playerSpeed
        // this.playerSpeed variable is no longer strictly needed if speed is managed by Snake class
        // However, we might keep it if player-specific speed logic (like boosts) directly modifies this.speed
    }

    /**
     * 获取蛇头的Cube
     * @returns {Cube|null}
     */
    // 'head' getter is inherited from Snake, no need to redefine unless behavior changes.
    // get head() {
    //     return this.cubes.length > 0 ? this.cubes[0] : null;
    // }

    /**
     * 更新玩家蛇的逻辑
     * @param {PIXI.Ticker} delta - Ticker对象，用于获取deltaTime
     */
    update(delta) {
        if (!this.gameApp.pixi || !this.gameApp.rootContainer || !this.head) {
            return;
        }

        const headCube = this.head; // this.head is now inherited
        if (!headCube) return; // If no head, nothing to do
        const deltaTime = delta.deltaTime || 1;

        // --- 头部Cube的逻辑 (改编自原Player.js) ---

        // 1. 获取鼠标在rootContainer坐标系中的位置
        const globalMousePosition = this.gameApp.pixi.renderer.events.pointer.global;
        const localMouseInRoot = this.gameApp.rootContainer.toLocal(globalMousePosition);

        // 2. 获取头部Cube在rootContainer坐标系中的当前位置
        // headCube.parent is PlayerSnake (this). rootContainer is parent of PlayerSnake.
        const headPositionInRoot = this.gameApp.rootContainer.toLocal(headCube.getGlobalPosition(new PIXI.Point(), false)); 

        // 3. 计算头部Cube的旋转 (朝向鼠标)
        const dxRot = localMouseInRoot.x - headPositionInRoot.x;
        const dyRot = localMouseInRoot.y - headPositionInRoot.y;
        if (dxRot !== 0 || dyRot !== 0) {
            headCube.rotation = Math.atan2(dyRot, dxRot);
        }

        // 4. 计算头部Cube的意图移动目标 (在rootContainer坐标系中)
        const targetXInRoot = localMouseInRoot.x;
        const targetYInRoot = localMouseInRoot.y;

        const moveDx = targetXInRoot - headPositionInRoot.x;
        const moveDy = targetYInRoot - headPositionInRoot.y;
        const distanceToTarget = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

        let currentSpeed = this.speed; // Use inherited speed property
        const pointerState = this.gameApp.pixi.renderer.events.pointer;
        if ((pointerState.buttons & 1) !== 0) { // 左键按下，速度翻倍
            currentSpeed = this.speed * 2; // Boost based on inherited speed
        }

        let nextHeadXInRoot = headPositionInRoot.x;
        let nextHeadYInRoot = headPositionInRoot.y;

        if (distanceToTarget > 10) { // 平滑移动阈值
            nextHeadXInRoot += (moveDx / distanceToTarget) * currentSpeed * deltaTime;
            nextHeadYInRoot += (moveDy / distanceToTarget) * currentSpeed * deltaTime;
        } else if (distanceToTarget > 0) { // 接近目标，直接到达
            nextHeadXInRoot = targetXInRoot;
            nextHeadYInRoot = targetYInRoot;
        }

        // 5. 限制头部Cube的意图位置在圆形边界内 (在rootContainer坐标系中)
        const maxRadius = this.gameApp.radius; 
        const distanceFromNextPosToCenter = Math.sqrt(nextHeadXInRoot * nextHeadXInRoot + nextHeadYInRoot * nextHeadYInRoot);

        let finalHeadXInRoot = nextHeadXInRoot;
        let finalHeadYInRoot = nextHeadYInRoot;

        if (distanceFromNextPosToCenter > maxRadius) {
            const angleToNextPos = Math.atan2(nextHeadYInRoot, nextHeadXInRoot);
            finalHeadXInRoot = Math.cos(angleToNextPos) * maxRadius;
            finalHeadYInRoot = Math.sin(angleToNextPos) * maxRadius;
        }

        // 6. 将计算出的最终头部位置 (在rootContainer坐标系中) 转换回headCube的父容器(PlayerSnake, i.e., this)的本地坐标系，并应用
        const finalHeadPosInPlayerSnakeLocal = this.toLocal(new PIXI.Point(finalHeadXInRoot, finalHeadYInRoot), this.gameApp.rootContainer);
        headCube.x = finalHeadPosInPlayerSnakeLocal.x;
        headCube.y = finalHeadPosInPlayerSnakeLocal.y;
        
        // --- 头部Cube逻辑结束 ---

        // 7. 更新蛇身体部分的跟随逻辑 (调用 Snake.js 中的方法)
        this.updateSnakeLogic(deltaTime);
    }

    /**
     * 使玩家蛇生长，向尾部添加一个新的Cube
     * @param {number} value - 新Cube的数值，默认为2
     */
    grow(value = 2) {
        // addCube is inherited from Snake
        this.addCube(value);
        // Ensure the new cube also gets the correct speed if not handled by Snake.addCube already
        // (It is handled by Snake.addCube now)
    }

    destroy(options) {
        // Snake's destroy method (from PIXI.Container) will handle destroying children (cubes)
        // if options.children is true. We might not need to do anything special here unless
        // Snake class itself adds more complex cleanup.
        super.destroy(options); 
    }
}
