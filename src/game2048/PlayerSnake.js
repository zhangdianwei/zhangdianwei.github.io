import * as PIXI from 'pixi.js';
import { GameApp } from './GameApp.js';
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
        const initialLength = 1;
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
        // 1. 常规运动（抽出为独立函数）
        this.updateNormalMovement(delta);
        // 2. 合成动画叠加（只对pendingMerge的cubeA/cubeB做动画修饰）
        if (this.pendingMerge) {
            this.updateMergeAnimation(delta);
        } else {
            this.mergeCubesIfPossible();
        }
    }

    /**
     * 常规运动部分：速度调整、头部方向与旋转、边界限制、头部位置、身体跟随
     */
    updateNormalMovement(delta) {
        if (!this.gameApp.pixi || !this.gameApp.rootContainer || !this.head) {
            return;
        }
        const headCube = this.head;
        const deltaTime = delta.deltaTime || 1;
        // 速度调整
        const pointerState = this.gameApp.pixi.renderer.events.pointer;
        let currentFrameTargetSpeed = this.baseSpeed;
        if ((pointerState.buttons & 1) !== 0) {
            currentFrameTargetSpeed = this.baseSpeed * 2;
        }
        if (currentFrameTargetSpeed !== this.lastAppliedSpeed) {
            this.speed = currentFrameTargetSpeed;
            this.lastAppliedSpeed = currentFrameTargetSpeed;
            for (const cube of this.cubes) {
                cube.speed = currentFrameTargetSpeed;
            }
        }
        // --- 头部Cube运动逻辑 ---
        const globalMousePosition = this.gameApp.pixi.renderer.events.pointer.global;
        const localMouseInRoot = this.gameApp.rootContainer.toLocal(globalMousePosition);
        const headPositionInRoot = this.gameApp.rootContainer.toLocal(headCube.getGlobalPosition(new PIXI.Point(), false));
        const mouseMovedThreshold = 1;
        if (Math.abs(localMouseInRoot.x - this.lastMouseX) > mouseMovedThreshold ||
            Math.abs(localMouseInRoot.y - this.lastMouseY) > mouseMovedThreshold ||
            this.lastMouseX === -1) {
            const dx = localMouseInRoot.x - headPositionInRoot.x;
            const dy = localMouseInRoot.y - headPositionInRoot.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0.01) {
                this.targetDirectionX = dx / len;
                this.targetDirectionY = dy / len;
            }
            this.lastMouseX = localMouseInRoot.x;
            this.lastMouseY = localMouseInRoot.y;
        }
        const currentSpeed = headCube.speed;
        let nextHeadXInRoot = headPositionInRoot.x + this.targetDirectionX * currentSpeed * deltaTime;
        let nextHeadYInRoot = headPositionInRoot.y + this.targetDirectionY * currentSpeed * deltaTime;
        const targetAngle = Math.atan2(this.targetDirectionY, this.targetDirectionX);
        const currentRotation = normalizeAnglePi(headCube.rotation);
        const angleDifference = shortestAngleDist(currentRotation, targetAngle);
        const rotationLerpFactor = 0.15;
        headCube.rotation += angleDifference * rotationLerpFactor;
        headCube.rotation = normalizeAnglePi(headCube.rotation);
        // 限制头部在圆形边界内
        const maxRadius = this.gameApp.radius;
        const distanceFromNextPosToCenter = Math.sqrt(nextHeadXInRoot * nextHeadXInRoot + nextHeadYInRoot * nextHeadYInRoot);
        let finalHeadXInRoot = nextHeadXInRoot;
        let finalHeadYInRoot = nextHeadYInRoot;
        if (distanceFromNextPosToCenter > maxRadius) {
            const angleToNextPos = Math.atan2(nextHeadYInRoot, nextHeadXInRoot);
            finalHeadXInRoot = Math.cos(angleToNextPos) * maxRadius;
            finalHeadYInRoot = Math.sin(angleToNextPos) * maxRadius;
        }
        const finalHeadPosInPlayerSnakeLocal = this.toLocal(new PIXI.Point(finalHeadXInRoot, finalHeadYInRoot), this.gameApp.rootContainer);
        headCube.x = finalHeadPosInPlayerSnakeLocal.x;
        headCube.y = finalHeadPosInPlayerSnakeLocal.y;
        // --- 身体Cube跟随 ---
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
                // 分阶段动画：phase 1 追逐，phase 2 弹跳，phase 3 收尾，phase 4 冷却
                this.pendingMerge = {
                    i,
                    cubeA,
                    cubeB,
                    animTime: 0,
                    phase: 1, // 1:追逐, 2:弹跳, 3:收尾, 4:冷却
                    phase1Duration: 200, // 追逐400ms
                    phase2Duration: 250, // 弹跳250ms
                    cooldownDuration: 200, // 冷却200ms
                    startPosB: { x: cubeB.x, y: cubeB.y },
                    mergeTargetPos: { x: cubeA.x, y: cubeA.y }, // 锁定合成目标点
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
            // 追逐阶段：cubeB追逐cubeA实时位置，缓动+动画时长保护
            const targetX = pm.cubeA.x;
            const targetY = pm.cubeA.y;
            // 动态分配追逐速度：保证cubeB在剩余动画时长内追上cubeA
            const dx = targetX - pm.cubeB.x;
            const dy = targetY - pm.cubeB.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const phase1Total = pm.phase1Duration || 2000;
            const remainTime = Math.max(0.001, phase1Total - pm.animTime); // 防止除0
            // 计算本帧需要移动的距离，确保剩余时间内追上
            let move = dist / (remainTime / dt);
            const maxMove = Math.min(move, dist); // 限制本帧最多只能追到目标点
            // console.log(dist, remainTime)
            if (dist > 10 && remainTime > 0) {
                pm.cubeB.x += (dx / dist) * maxMove;
                pm.cubeB.y += (dy / dist) * maxMove;
            } else {
                pm.cubeB.x = targetX;
                pm.cubeB.y = targetY;
            }
            // alpha渐变
            let distAlpha = Math.sqrt((targetX - pm.cubeB.x) ** 2 + (targetY - pm.cubeB.y) ** 2);
            distAlpha = 50;
            pm.cubeB.alpha = pm.startAlphaB * Math.max(0, Math.min(1, distAlpha / 50));
            pm.cubeA.scale.set(1);
            // 动画时长保护，或距离足够近直接进入下一阶段
            if (pm.animTime > (pm.phase1Duration || 4000) || dist <= 2) {
                pm.cubeB.x = targetX;
                pm.cubeB.y = targetY;
                pm.cubeB.alpha = 0;
                pm.phase = 2;
                pm.animTime = 0;
            }
        } else if (pm.phase === 2) {
            // 弹跳阶段：cubeA scale 1->1.8->1
            const t = Math.min(pm.animTime / pm.phase2Duration, 1);
            let scale;
            if (t < 0.5) {
                scale = 1 + 0.2 * (t * 2); // 1→1.2
                // 在t==0.5时执行真正合成，只执行一次
                if (!pm.hasMerged && Math.abs(t - 0.5) < dt / pm.phase2Duration) {
                    const newValue = pm.cubeA.currentValue * 2;
                    pm.cubeA.setValue(newValue);
                    pm.cubeA.scale.set(1.2); // 保持视觉峰值
                    pm.cubeB.scale.set(1);
                    pm.cubeB.alpha = 1;
                    if (pm.cubeB.parent) {
                        this.removeChild(pm.cubeB);
                    }
                    const idx = this.cubes.indexOf(pm.cubeB);
                    if (idx !== -1) {
                        this.cubes.splice(idx, 1);
                    }
                    // --- 补位逻辑：让cubeA与前一个cube保持segmentLength距离，避免掉队 ---
                    if (pm.i > 0 && this.cubes.length > 1) {
                        const leader = this.cubes[pm.i - 1];
                        const dx = pm.cubeA.x - leader.x;
                        const dy = pm.cubeA.y - leader.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist !== this.segmentLength && dist > 0.01) {
                            pm.cubeA.x = leader.x + (dx / dist) * this.segmentLength;
                            pm.cubeA.y = leader.y + (dy / dist) * this.segmentLength;
                        }
                    }
                    pm.hasMerged = true;
                }
            } else {
                scale = 1.2 - 0.2 * ((t - 0.5) * 2); // 1.2→1
            }
            pm.cubeA.scale.set(scale);
            if (t >= 1) {
                pm.phase = 4;
                pm.animTime = 0;
            }
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
