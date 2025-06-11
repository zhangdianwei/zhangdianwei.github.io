import * as PIXI from 'pixi.js';
import Cube from './Cube.js';
import { GameApp } from './GameApp.js';

function shortestAngleDist(a0, a1) {
    const max = Math.PI * 2;
    const da = (a1 - a0) % max;
    return ((2 * da) % max) - da;
}

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

export default class Snake extends PIXI.Container {
    constructor(initialCubesData = [], baseSpeed) {
        super();

        this.cubes = [];
        this.baseSpeed = baseSpeed;
        this.speedRatio = 1; // 全局倍率

        initialCubesData.forEach(data => {
            this.addCube(data.value);
        });

        this.pendingMerge = null;

        GameApp.instance.ticker.add(this.update, this);
    }

    get head() {
        return this.cubes[0];
    }

    computeIdealCubePose(leaderCube, currentCube) {
        const currentSize = currentCube.getSize();
        const leaderSize = leaderCube.getSize();
        const idealGap = (leaderSize + currentSize) / 4;
        // 先按leader方向推算目标点
        const x = leaderCube.x - Math.cos(leaderCube.rotation) * idealGap;
        const y = leaderCube.y - Math.sin(leaderCube.rotation) * idealGap;
        // rotation应为leader到current的连线方向
        const dx = x - leaderCube.x;
        const dy = y - leaderCube.y;
        let rotation = leaderCube.rotation;
        if (dx !== 0 || dy !== 0) {
            rotation = Math.atan2(dy, dx);
        }
        return { x, y, rotation };
    }

    addCube(value) {
        let x = 0, y = 0, rotation = 0;
        let idx = this.cubes.length;
        while (idx > 0 && this.cubes[idx - 1].currentValue < value) {
            idx--;
        }
        const newCube = new Cube(value, 0, 0);
        if (this.cubes.length > 0) {
            let prev = idx > 0 ? this.cubes[idx - 1] : null;
            let next = this.cubes[idx] || null;
            if (prev) {
                // 以前一个cube为leader，计算理想插入位
                const pose = this.computeIdealCubePose(prev, newCube);
                x = pose.x;
                y = pose.y;
                rotation = pose.rotation;
            } else if (next) {
                // 反向
                x = next.x + Math.cos(next.rotation) * ((next.getSize() + newCube.getSize()) / 4);
                y = next.y + Math.sin(next.rotation) * ((next.getSize() + newCube.getSize()) / 4);
                rotation = next.rotation + Math.PI;
            }
        }
        newCube.x = x;
        newCube.y = y;
        newCube.rotation = rotation;
        newCube.snake = this;

        this.cubes.splice(idx, 0, newCube);
        this.addChild(newCube);
        this.updateCubeZOrder();
        return newCube;
    }

    update(delta) {
        this.updateNormalMovement(delta);
        if (this.pendingMerge) {
            this.updateMergeAnimation(delta);
        } else if (this.mergeCooldown && this.mergeCooldown > 0) {
            const dt = delta && delta.deltaMS ? delta.deltaMS : 16;
            this.mergeCooldown -= dt;
            if (this.mergeCooldown < 0) this.mergeCooldown = 0;
        } else {
            this.mergeCubesIfPossible();
        }
    }

    /**
     * 通用推进与旋转工具
     * @param {object} obj 需要移动的对象（cube/head）
     * @param {number} targetX
     * @param {number} targetY
     * @param {number} speed
     * @param {number} deltaTime
     * @param {number} [rotationLerp=1] 插值因子，1为直接对齐
     */
    moveAndRotate(obj, targetX, targetY, speed, deltaTime, rotationLerp = 1) {
        const dx = targetX - obj.x;
        const dy = targetY - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0.01) {
            const targetAngle = Math.atan2(dy, dx);
            const angleDiff = shortestAngleDist(normalizeAnglePi(obj.rotation), targetAngle);
            obj.rotation = normalizeAnglePi(obj.rotation + angleDiff * rotationLerp);
        }
        if (distance > 0.01) {
            const moveDist = Math.min(speed * deltaTime, distance);
            obj.x += (dx / distance) * moveDist;
            obj.y += (dy / distance) * moveDist;
        }
    }

    updateHeadDirectionStrategy(delta) { }

    /**
     * 彻底从场景和逻辑中移除该蛇
     * @param {PIXI.Container} rootContainer
     * @param {Array<EnermySnake>} enemySnakes
     * @param {PIXI.Application} app
     */
    removeSelfFromGame(rootContainer, enemySnakes, app) {
        if (rootContainer && this.parent) rootContainer.removeChild(this);
        if (this.cubes) this.cubes.length = 0;
        // 如果是敌人蛇，从enemySnakes数组移除并注销ticker
        if (enemySnakes && Array.isArray(enemySnakes)) {
            const idx = enemySnakes.indexOf(this);
            if (idx !== -1) {
                GameApp.instance.ticker.remove(this.update, this);
                enemySnakes.splice(idx, 1);
            }
        }
    }

    get finalSpeed() {
        return this.baseSpeed * this.speedRatio;
    }

    setHeadDirection(x, y) {
        // 归一化向量，避免速度异常
        const len = Math.sqrt(x * x + y * y);
        if (len > 0.00001) {
            this.targetDirectionX = x / len;
            this.targetDirectionY = y / len;
        } else {
            this.targetDirectionX = 1;
            this.targetDirectionY = 0;
        }
    }

    updateHeadMovement(deltaTime){
        const headCube = this.head;
        
        const targetAngle = Math.atan2(this.targetDirectionY, this.targetDirectionX);
        const currentRotation = normalizeAnglePi(headCube.rotation);
        const angleDifference = shortestAngleDist(currentRotation, targetAngle);
        const rotationLerpFactor = 0.15;
        headCube.rotation += angleDifference * rotationLerpFactor;
        headCube.rotation = normalizeAnglePi(headCube.rotation);

        // 蛇头移动：按当前方向推进
        headCube.x += this.targetDirectionX * this.finalSpeed * deltaTime;
        headCube.y += this.targetDirectionY * this.finalSpeed * deltaTime;

        // 不要超出圆形区域
        if (this.gameApp && typeof this.gameApp.radius === 'number') {
            const maxRadius = this.gameApp.radius;
            const distToCenter = Math.sqrt(headCube.x * headCube.x + headCube.y * headCube.y);
            if (distToCenter > maxRadius) {
                const clampAngle = Math.atan2(headCube.y, headCube.x);
                headCube.x = Math.cos(clampAngle) * maxRadius;
                headCube.y = Math.sin(clampAngle) * maxRadius;
            }
        }

        // if (this.constructor.name === 'EnermySnake') {
        //     console.log('snake head pos', this.targetDirectionX, this.targetDirectionY);
        // }
    }

    updateNormalMovement(delta) {
        const deltaTime = delta && delta.deltaTime ? delta.deltaTime : 1;

        this.updateHeadDirectionStrategy(delta);

        this.updateHeadMovement(deltaTime);

        // 排除合并动画中的cubeB
        let excludeIndex = -1;
        if (this.pendingMerge && this.pendingMerge.cubeB) {
            excludeIndex = this.cubes.indexOf(this.pendingMerge.cubeB);
        }
        this.updateSnakeLogic(deltaTime, excludeIndex);
    }

    mergeCubesIfPossible() {
        if (this.pendingMerge) return;
        if (this.cubes.length < 2) return;
        for (let i = 0; i < this.cubes.length - 1; i++) {
            const cubeA = this.cubes[i];
            const cubeB = this.cubes[i + 1];
            if (cubeA.currentValue === cubeB.currentValue) {
                this.pendingMerge = {
                    i,
                    cubeA,
                    cubeB,
                    animTime: 0,
                    phase: 1,
                    hasMerged: false
                };
                break;
            }
        }
    }

    triggerMergeAnimation(cubeA, cubeB) {
        cubeB.speedRatio = 2; // 合并动画期间加速
        // 合并完成后记得 cubeB.speedRatio = 1
    }

    updateMergeAnimation(delta) {
        const pm = this.pendingMerge;
        if (!pm || !pm.cubeA || !pm.cubeB) {
            this.pendingMerge = null;
            return;
        }
        const DURATION = 200;
        const dt = delta && delta.deltaMS ? delta.deltaMS : 16;
        pm.animTime += dt;
        // 记录初始位置
        if (pm._startX === undefined) {
            pm._startX = pm.cubeB.x;
            pm._startY = pm.cubeB.y;
        }
        const t = Math.min(pm.animTime / DURATION, 1);
        // 匀速插值
        pm.cubeB.x = pm._startX + (pm.cubeA.x - pm._startX) * t;
        pm.cubeB.y = pm._startY + (pm.cubeA.y - pm._startY) * t;
        // 可选：透明度渐变
        pm.cubeB.alpha = 1 - t;
        if (t >= 1) {
            if (pm.cubeB && pm.cubeB.parent) {
                this.removeChild(pm.cubeB);
            }
            const idx = this.cubes.indexOf(pm.cubeB);
            if (idx !== -1) {
                this.cubes.splice(idx, 1);
            }
            pm.cubeA.setValue(pm.cubeA.currentValue * 2);
            this.pendingMerge = null;
            this.mergeCooldown = 200;
        }
    }

    updateSnakeLogic(deltaTime, excludeIndex = -1) {
        if (this.cubes.length < 2) return;
        for (let i = 1; i < this.cubes.length; i++) {
            if (i === excludeIndex) continue;
            const leader = this.cubes[i-1];
            const cube = this.cubes[i];
            const dx = leader.x - cube.x;
            const dy = leader.y - cube.y;
            const distanceToLeader = Math.sqrt(dx * dx + dy * dy);
            const idealGap = (leader.getSize() + cube.getSize()) / 4;

            if (distanceToLeader > idealGap) {
                // 推进+旋转（插值推进，有追击感）
                const targetX = leader.x - (dx / distanceToLeader) * idealGap;
                const targetY = leader.y - (dy / distanceToLeader) * idealGap;
                const speed = this.finalSpeed * cube.speedRatio;
                this.moveAndRotate(cube, targetX, targetY, speed, deltaTime, 1.5);
            } else if (distanceToLeader > 0.01) {
                // 过近或重叠，直接对齐
                const targetX = leader.x - (dx / distanceToLeader) * idealGap;
                const targetY = leader.y - (dy / distanceToLeader) * idealGap;
                cube.x = targetX;
                cube.y = targetY;
                cube.rotation = leader.rotation;
            } else {
                // 完全重叠
                const targetX = leader.x - Math.cos(leader.rotation) * idealGap;
                const targetY = leader.y - Math.sin(leader.rotation) * idealGap;
                cube.x = targetX;
                cube.y = targetY;
                cube.rotation = leader.rotation;
            }
        }
    }

    updateCubeZOrder() {
        for (let i = 0; i < this.cubes.length; i++) {
            this.setChildIndex(this.cubes[i], this.cubes.length - 1 - i);
        }
    }
}
