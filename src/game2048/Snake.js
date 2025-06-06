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

        this.updateSnakeLogic(deltaTime);
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
                    phase1Duration: 200,
                    phase2Duration: 250,
                    cooldownDuration: 200,
                    startPosB: { x: cubeB.x, y: cubeB.y },
                    mergeTargetPos: { x: cubeA.x, y: cubeA.y },
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
        if (!pm || !pm.cubeA || !pm.cubeB) {
            this.pendingMerge = null;
            return;
        }
        const dt = delta && delta.deltaMS ? delta.deltaMS : 16;
        pm.animTime += dt;
        if (!pm.cubeA || !pm.cubeB) {
            this.pendingMerge = null;
            return;
        }
        if (pm.phase === 1) {
            const targetX = pm.cubeA.x;
            const targetY = pm.cubeA.y;
            const dx = targetX - pm.cubeB.x;
            const dy = targetY - pm.cubeB.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const phase1Total = pm.phase1Duration || 2000;
            const remainTime = Math.max(0.001, phase1Total - pm.animTime);
            let move = dist / (remainTime / dt);
            const maxMove = Math.min(move, dist);
            if (dist > 10 && remainTime > 0) {
                pm.cubeB.x += (dx / dist) * maxMove;
                pm.cubeB.y += (dy / dist) * maxMove;
            } else {
                pm.cubeB.x = targetX;
                pm.cubeB.y = targetY;
            }
            let distAlpha = Math.sqrt((targetX - pm.cubeB.x) * 2 + (targetY - pm.cubeB.y) * 2);
            distAlpha = 50;
            pm.cubeB.alpha = pm.startAlphaB * Math.max(0, Math.min(1, distAlpha / 50));
            pm.cubeA.scale.set(1);
            if (pm.animTime >= (pm.phase1Duration || 4000) || dist <= 2) {
                if (pm.cubeB) {
                    pm.cubeB.x = targetX;
                    pm.cubeB.y = targetY;
                    pm.cubeB.alpha = 0;
                }
                pm.phase = 2;
                pm.animTime = 0;
            }
        } else if (pm.phase === 2) {
            const t = Math.min(pm.animTime / pm.phase2Duration, 1);
            let scale;
            if (t < 0.5) {
                scale = 1 + 0.2 * (t * 2);
                if (!pm.hasMerged && Math.abs(t - 0.5) < dt / pm.phase2Duration) {
                    if (!pm.cubeA || !pm.cubeB) {
                        this.pendingMerge = null;
                        return;
                    }
                    const newValue = pm.cubeA.currentValue * 2;
                    pm.cubeA.setValue(newValue);
                    pm.cubeA.scale.set(1.2);
                    pm.cubeB.scale.set(1);
                    pm.cubeB.alpha = 1;
                    if (pm.cubeB.parent) {
                        this.removeChild(pm.cubeB);
                    }
                    const idx = this.cubes.indexOf(pm.cubeB);
                    if (idx !== -1) {
                        this.cubes.splice(idx, 1);
                    }
                    pm.cubeB = null;
                    const leader = this.cubes[pm.i - 1];
                    if (pm.cubeA && leader) {
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
            }

            if (t >= 1) {
                this.pendingMerge = null;
            }
        }
    }

    updateSnakeLogic(deltaTime) {
        if (this.cubes.length < 2) return;
        for (let i = 1; i < this.cubes.length; i++) {
            const currentCube = this.cubes[i];
            const leaderCube = this.cubes[i - 1];
            const dx = leaderCube.x - currentCube.x;
            const dy = leaderCube.y - currentCube.y;
            const distanceToLeader = Math.sqrt(dx * dx + dy * dy);
            if (distanceToLeader > 0.01) {
                currentCube.rotation = Math.atan2(dy, dx);
            }
            if (distanceToLeader > this.segmentLength) {
                const moveCapacity = currentCube.speed * deltaTime;
                const desiredGapReduction = distanceToLeader - this.segmentLength;
                const actualMoveDistance = Math.min(moveCapacity, desiredGapReduction);
                if (distanceToLeader > 0.01) {
                    currentCube.x += (dx / distanceToLeader) * actualMoveDistance;
                    currentCube.y += (dy / distanceToLeader) * actualMoveDistance;
                }
            } else if (distanceToLeader < this.segmentLength && distanceToLeader > 0.01) {
                currentCube.x = leaderCube.x - (dx / distanceToLeader) * this.segmentLength;
                currentCube.y = leaderCube.y - (dy / distanceToLeader) * this.segmentLength;
            } else if (distanceToLeader <= 0.01 && i > 0) {
                currentCube.x = leaderCube.x - Math.cos(leaderCube.rotation) * this.segmentLength;
                currentCube.y = leaderCube.y - Math.sin(leaderCube.rotation) * this.segmentLength;
            }
        }
    }

    updateCubeZOrder() {
        for (let i = 0; i < this.cubes.length; i++) {
            this.setChildIndex(this.cubes[i], this.cubes.length - 1 - i);
        }
    }
}
