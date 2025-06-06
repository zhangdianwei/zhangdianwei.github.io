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
    constructor(initialCubesData = [], segmentLength, speed) {
        super();

        this.cubes = [];
        this.segmentLength = segmentLength;
        this.speed = speed;

        initialCubesData.forEach(data => {
            this.addCube(data.value, data.x, data.y);
        });

        this.pendingMerge = null;
    }

    get head() {
        return this.cubes[0];
    }

    addCube(value, x = 0, y = 0) {
        if (this.cubes.length > 0) {
            const lastCube = this.cubes[this.cubes.length - 1];
            x = lastCube.x - Math.cos(lastCube.rotation) * this.segmentLength;
            y = lastCube.y - Math.sin(lastCube.rotation) * this.segmentLength;
        }

        const newCube = new Cube(value, x, y);
        newCube.speed = this.speed;
        this.cubes.push(newCube);
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

        const finalSpeed = this.finalSpeed;
        if (finalSpeed !== this.lastAppliedSpeed) {
            this.lastAppliedSpeed = finalSpeed;
            for (const cube of this.cubes) {
                cube.speed = finalSpeed;
            }
        }

        const targetAngle = Math.atan2(this.targetDirectionY, this.targetDirectionX);
        const currentRotation = normalizeAnglePi(headCube.rotation);
        const angleDifference = shortestAngleDist(currentRotation, targetAngle);
        const rotationLerpFactor = 0.15;
        headCube.rotation += angleDifference * rotationLerpFactor;
        headCube.rotation = normalizeAnglePi(headCube.rotation);

        headCube.x += this.targetDirectionX * headCube.speed * deltaTime;
        headCube.y += this.targetDirectionY * headCube.speed * deltaTime;

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
            const scaleA = leaderCube.scale.x;
            const scaleB = currentCube.scale.x;
            const idealGap = this.segmentLength * ((scaleA + scaleB) / 2);
            if (distanceToLeader > 0.01) {
                currentCube.rotation = Math.atan2(dy, dx);
            }
            if (distanceToLeader > idealGap) {
                const moveCapacity = currentCube.speed * deltaTime;
                const desiredGapReduction = distanceToLeader - idealGap;
                const actualMoveDistance = Math.min(moveCapacity, desiredGapReduction);
                if (distanceToLeader > 0.01) {
                    currentCube.x += (dx / distanceToLeader) * actualMoveDistance;
                    currentCube.y += (dy / distanceToLeader) * actualMoveDistance;
                }
            } else if (distanceToLeader < idealGap && distanceToLeader > 0.01) {
                currentCube.x = leaderCube.x - (dx / distanceToLeader) * idealGap;
                currentCube.y = leaderCube.y - (dy / distanceToLeader) * idealGap;
            } else if (distanceToLeader <= 0.01 && i > 0) {
                currentCube.x = leaderCube.x - Math.cos(leaderCube.rotation) * idealGap;
                currentCube.y = leaderCube.y - Math.sin(leaderCube.rotation) * idealGap;
            }
        }
    }

    updateCubeZOrder() {
        for (let i = 0; i < this.cubes.length; i++) {
            this.setChildIndex(this.cubes[i], this.cubes.length - 1 - i);
        }
    }
}
