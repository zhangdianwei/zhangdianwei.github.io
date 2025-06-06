import * as PIXI from 'pixi.js';
import Cube from './Cube.js';

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
    constructor(initialCubesData = [], speed) {
        super();

        this.cubes = [];

        this.speed = speed;

        initialCubesData.forEach(data => {
            this.addCube(data.value);
        });

        this.pendingMerge = null;
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
        let idx = 0;
        while (idx < this.cubes.length && this.cubes[idx].currentValue > value) {
            idx++;
        }
        const newCube = new Cube(value, 0, 0);
        if (this.cubes.length > 0) {
            let prev = idx > 0 ? this.cubes[idx - 1] : null;
            let next = this.cubes[idx] || null;
            if (prev && next) {
                // 插入到中间，取前后cube连线方向
                const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
                const gap = (prev.getSize() + newCube.getSize()) / 2;
                x = prev.x + Math.cos(angle) * gap;
                y = prev.y + Math.sin(angle) * gap;
                rotation = angle;
            } else if (prev) {
                // 插入到队尾
                rotation = prev.rotation;
                const gap = (prev.getSize() + newCube.getSize()) / 2;
                x = prev.x - Math.cos(rotation) * gap;
                y = prev.y - Math.sin(rotation) * gap;
            } else if (next) {
                // 插入到队首
                rotation = next.rotation;
                const gap = (newCube.getSize() + next.getSize()) / 2;
                x = next.x + Math.cos(rotation) * gap;
                y = next.y + Math.sin(rotation) * gap;
            }
        }
        newCube.x = x;
        newCube.y = y;
        newCube.rotation = rotation;

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

    setHeadDirection(x, y) {
        this.targetDirectionX = x;
        this.targetDirectionY = y;
    }

    updateHeadDirectionStrategy(delta) { }

    get finalSpeed(){
        const speedRatio = (typeof this.speedRatio === 'number') ? this.speedRatio : 1;
        const currentFrameTargetSpeed = this.speed * speedRatio;
        return currentFrameTargetSpeed;
    }

    updateNormalMovement(delta) {
        if (!this.head) return;
        const headCube = this.head;
        const deltaTime = delta && delta.deltaTime ? delta.deltaTime : 1;

        this.updateHeadDirectionStrategy(delta);

        const targetAngle = Math.atan2(this.targetDirectionY, this.targetDirectionX);
        const currentRotation = normalizeAnglePi(headCube.rotation);
        const angleDifference = shortestAngleDist(currentRotation, targetAngle);
        const rotationLerpFactor = 0.15;
        headCube.rotation += angleDifference * rotationLerpFactor;
        headCube.rotation = normalizeAnglePi(headCube.rotation);

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
            const currentCube = this.cubes[i];
            const leaderCube = this.cubes[i - 1];
            const dx = leaderCube.x - currentCube.x;
            const dy = leaderCube.y - currentCube.y;
            const distanceToLeader = Math.sqrt(dx * dx + dy * dy);
            const pose = this.computeIdealCubePose(leaderCube, currentCube);
            const idealGap = (leaderCube.getSize() + currentCube.getSize()) / 4;
            if (distanceToLeader > 0.01) {
                currentCube.rotation = Math.atan2(dy, dx);
            }
            if (distanceToLeader > idealGap) {
                const moveCapacity = this.finalSpeed * deltaTime;
                const desiredGapReduction = distanceToLeader - idealGap;
                const actualMoveDistance = Math.min(moveCapacity, desiredGapReduction);
                if (distanceToLeader > 0.01) {
                    currentCube.x += (dx / distanceToLeader) * actualMoveDistance;
                    currentCube.y += (dy / distanceToLeader) * actualMoveDistance;
                }
            } else if (distanceToLeader < idealGap && distanceToLeader > 0.01) {
                currentCube.x = pose.x;
                currentCube.y = pose.y;
            } else if (distanceToLeader <= 0.01 && i > 0) {
                currentCube.x = pose.x;
                currentCube.y = pose.y;
            }
        }
    }

    updateCubeZOrder() {
        for (let i = 0; i < this.cubes.length; i++) {
            this.setChildIndex(this.cubes[i], this.cubes.length - 1 - i);
        }
    }
}
