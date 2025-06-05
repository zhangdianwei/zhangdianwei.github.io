import * as PIXI from 'pixi.js';
import {GameApp} from './GameApp.js';
import Snake from './Snake.js';

// Helper function to find the shortest angle between two angles (in radians)
function shortestAngleDist(a0, a1) {
    const max = Math.PI * 2;
    const da = (a1 - a0) % max;
    return ((2 * da) % max) - da;
}

// Helper function to normalize an angle to the range [-PI, PI]
function normalizeAnglePi(angle) {
    angle = angle % (Math.PI * 2);
    if (angle > Math.PI) {
        angle -= Math.PI * 2;
    }
    if (angle < -Math.PI) {
        angle += Math.PI * 2;
    }
    return angle;
}
// Cube class is implicitly used by Snake, but not directly instantiated here typically

export default class PlayerSnake extends Snake {
    /**
     * @param {number} initialValue - 蛇头Cube的初始数值
     * @param {number} segmentLength - 蛇段之间的期望长度
     */
    constructor(initialValue = 2, segmentLength = 30, playerSpeed = 5, initialLength = 10) {
        const initialCubesData = [];
        for (let i = 0; i < initialLength; i++) {
            // For simplicity, all initial cubes will have the same 'initialValue'.
            // The Snake.addCube logic will position them correctly relative to each other.
            // We only need to provide a value for each. The x, y can be 0 as addCube handles placement.
            initialCubesData.push({ value: initialValue, x: 0, y: 0 });
        }

        // Call Snake constructor: initialCubesData, segmentLength, speed
        super(initialCubesData, segmentLength, playerSpeed);

        this.gameApp = GameApp.instance;
        this.baseSpeed = playerSpeed; // Store the base speed
        this.lastAppliedSpeed = playerSpeed; // Track the last speed applied to all cubes

        // Initial target direction (e.g., moving to the right)
        // This will be updated as soon as the mouse moves for the first time.
        this.targetDirectionX = 1;
        this.targetDirectionY = 0;
        this.lastMouseX = -1; // Used to detect mouse movement
        this.lastMouseY = -1;

        // Ensure all initially created cubes have their speed set correctly by the Snake constructor
        // (Snake constructor already sets newCube.speed = this.speed, which is playerSpeed here)
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

        const headCube = this.head;
        if (!headCube) return;
        const deltaTime = delta.deltaTime || 1;

        // Determine current frame's target speed (base or boosted)
        const pointerState = this.gameApp.pixi.renderer.events.pointer;
        let currentFrameTargetSpeed = this.baseSpeed;
        if ((pointerState.buttons & 1) !== 0) { // Left mouse button pressed
            currentFrameTargetSpeed = this.baseSpeed * 2;
        }

        // If the target speed for this frame is different from the last applied speed,
        // update all cubes' speed and the PlayerSnake's main speed property.
        if (currentFrameTargetSpeed !== this.lastAppliedSpeed) {
            this.speed = currentFrameTargetSpeed; // Update PlayerSnake's own speed property
            for (const cube of this.cubes) {
                cube.speed = currentFrameTargetSpeed;
            }
            this.lastAppliedSpeed = currentFrameTargetSpeed;
        }


        // --- 头部Cube的逻辑 (改编自原Player.js) ---

        // 1. 获取鼠标在rootContainer坐标系中的位置
        const globalMousePosition = this.gameApp.pixi.renderer.events.pointer.global;
        const localMouseInRoot = this.gameApp.rootContainer.toLocal(globalMousePosition);

        // 2. 获取头部Cube在rootContainer坐标系中的当前位置
        // headCube.parent is PlayerSnake (this). rootContainer is parent of PlayerSnake.
        const headPositionInRoot = this.gameApp.rootContainer.toLocal(headCube.getGlobalPosition(new PIXI.Point(), false)); 

        // 3. 更新目标方向 (如果鼠标移动了)
        const mouseMovedThreshold = 1; // Pixels mouse needs to move to be considered 'moved'
        if (Math.abs(localMouseInRoot.x - this.lastMouseX) > mouseMovedThreshold || 
            Math.abs(localMouseInRoot.y - this.lastMouseY) > mouseMovedThreshold ||
            this.lastMouseX === -1) { // Update on first frame too
            
            const dirX = localMouseInRoot.x - headPositionInRoot.x;
            const dirY = localMouseInRoot.y - headPositionInRoot.y;
            const length = Math.sqrt(dirX * dirX + dirY * dirY);

            if (length > 0.01) { // Avoid division by zero if mouse is exactly on head
                this.targetDirectionX = dirX / length;
                this.targetDirectionY = dirY / length;
            }
            this.lastMouseX = localMouseInRoot.x;
            this.lastMouseY = localMouseInRoot.y;
        }

        // 4. 蛇头始终沿 this.targetDirectionX, this.targetDirectionY 移动
        const currentSpeed = headCube.speed;
        let nextHeadXInRoot = headPositionInRoot.x + this.targetDirectionX * currentSpeed * deltaTime;
        let nextHeadYInRoot = headPositionInRoot.y + this.targetDirectionY * currentSpeed * deltaTime;

        // 5. 旋转蛇头以匹配其移动方向 (this.targetDirectionX, this.targetDirectionY)
        const targetAngle = Math.atan2(this.targetDirectionY, this.targetDirectionX);
        const currentRotation = normalizeAnglePi(headCube.rotation);
        const angleDifference = shortestAngleDist(currentRotation, targetAngle);
        const rotationLerpFactor = 0.15; // Adjust for smoothness
        headCube.rotation += angleDifference * rotationLerpFactor;
        headCube.rotation = normalizeAnglePi(headCube.rotation);

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
        // addCube is inherited from Snake and returns the new cube.
        // Snake.addCube already sets newCube.speed = this.speed (which is PlayerSnake's current overall speed)
        // However, to be absolutely sure it matches the potentially boosted speed, we can set it explicitly.
        const newCube = this.addCube(value); // Snake.addCube sets its speed to this.speed (PlayerSnake's speed)
        if (newCube) {
            newCube.speed = this.lastAppliedSpeed; // Ensure it gets the current dynamic speed
        }
    }

    destroy(options) {
        // Snake's destroy method (from PIXI.Container) will handle destroying children (cubes)
        // if options.children is true. We might not need to do anything special here unless
        // Snake class itself adds more complex cleanup.
        super.destroy(options); 
    }
}
