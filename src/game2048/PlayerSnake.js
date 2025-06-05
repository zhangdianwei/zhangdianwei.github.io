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
     * 玩家蛇构造函数。参数全部固定为默认值。
     * 初始值2，长度2，段长30，速度5。
     */
    constructor() {
        const initialValue = 2;
        const initialLength = 2;
        const segmentLength = 30;
        const playerSpeed = 5;
        const initialCubesData = [];
        for (let i = 0; i < initialLength; i++) {
            initialCubesData.push({ value: initialValue, x: 0, y: 0 });
        }
        super(initialCubesData, segmentLength, playerSpeed);
        this.gameApp = GameApp.instance;
        this.baseSpeed = playerSpeed;
        this.lastAppliedSpeed = playerSpeed;
        this.targetDirectionX = 1;
        this.targetDirectionY = 0;
        this.lastMouseX = -1;
        this.lastMouseY = -1;
        if (!this.gameApp) {
            console.error('GameApp instance is not available for PlayerSnake.');
        }
        this.pendingMerge = null; // 合成动画状态
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
        // --- 合成动画处理 ---
        if (this.pendingMerge) {
            this.updateMergeAnimation(delta);
        } else {
            // --- 合成逻辑：检测相邻Cube数值相同则合成 ---
            this.mergeCubesIfPossible();
        }
        // 无论是否有pendingMerge，蛇头和身体都要继续update
        if (!this.gameApp.pixi || !this.gameApp.rootContainer || !this.head) {
            return;
        }

        const headCube = this.head;
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
     * 检查cubes数组中是否有相邻Cube数值相同，如果有则合成为一个2倍Cube
     * 合成后Cube位置取靠前的Cube，被合成的Cube会被移除
     */
    mergeCubesIfPossible() {
        if (this.pendingMerge) return; // 动画期间不检测新合成
        if (this.cubes.length < 2) return;
        for (let i = 0; i < this.cubes.length - 1; i++) {
            const cubeA = this.cubes[i];
            const cubeB = this.cubes[i + 1];
            if (cubeA.currentValue === cubeB.currentValue) {
                // 分阶段动画：phase 1 吸附，phase 2 弹跳，phase 3 合成
                this.pendingMerge = {
                    i,
                    cubeA,
                    cubeB,
                    animTime: 0,
                    phase: 1, // 1:吸附, 2:弹跳, 3:收尾, 4:冷却
                    phase1Duration: 300, // 吸附300ms
                    phase2Duration: 200, // 弹跳200ms
                    cooldownDuration: 150, // 冷却150ms
                    startPosB: { x: cubeB.x, y: cubeB.y },
                    targetPos: { x: cubeA.x, y: cubeA.y },
                    startScaleA: cubeA.scale.x,
                    startScaleB: cubeB.scale.x,
                    startAlphaB: cubeB.alpha
                };
                break;
            }
        }
    }

    updateMergeAnimation(delta) {
        const pm = this.pendingMerge;
        if (!pm) return;
        const dt = delta && delta.deltaMS ? delta.deltaMS : 16;
        pm.animTime += dt;
        if (pm.phase === 1) {
            // 吸附阶段：cubeB快速靠近cubeA，透明度渐隐
            const t = Math.min(pm.animTime / pm.phase1Duration, 1);
            const easeT = t * t;
            pm.cubeB.x = pm.startPosB.x + (pm.targetPos.x - pm.startPosB.x) * easeT;
            pm.cubeB.y = pm.startPosB.y + (pm.targetPos.y - pm.startPosB.y) * easeT;
            pm.cubeB.alpha = pm.startAlphaB * (1 - t);
            pm.cubeA.scale.set(1);
            if (t >= 1) {
                pm.phase = 2;
                pm.animTime = 0;
                pm.cubeB.x = pm.targetPos.x;
                pm.cubeB.y = pm.targetPos.y;
                pm.cubeB.alpha = 0;
            }
        } else if (pm.phase === 2) {
            // 弹跳阶段：cubeA scale 1->1.8->1
            const t = Math.min(pm.animTime / pm.phase2Duration, 1);
            let scale;
            if (t < 0.5) {
                scale = 1 + 0.8 * (t * 2); // 1→1.8
            } else {
                scale = 1.8 - 0.8 * ((t - 0.5) * 2); // 1.8→1
            }
            pm.cubeA.scale.set(scale);
            if (t >= 1) {
                pm.phase = 3;
                pm.animTime = 0;
            }
        } else if (pm.phase === 3) {
            // 动画结束，真正合成
            const newValue = pm.cubeA.currentValue * 2;
            pm.cubeA.setValue(newValue);
            pm.cubeA.scale.set(1);
            pm.cubeB.scale.set(1);
            pm.cubeB.alpha = 1;
            this.removeChild(pm.cubeB);
            this.cubes.splice(pm.i + 1, 1);
            pm.phase = 4;
            pm.animTime = 0;
        } else if (pm.phase === 4) {
            // 冷却阶段，等待一段时间后才允许下次合成
            if (pm.animTime >= pm.cooldownDuration) {
                this.pendingMerge = null;
            }
        }
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
