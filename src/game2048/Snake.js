import * as PIXI from 'pixi.js';
import Cube from './Cube.js';
import { GameApp, GameLayer } from './GameApp.js';

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
    constructor() {
        super();

        this.cubes = [];
        this.setBaseSpeed(3);
        this.speedRatio = 1;
        this.pendingMerge = null;
        
        // 初始化方向属性，避免未定义错误
        this.targetDirectionX = 1;
        this.targetDirectionY = 0;
        
        // Debug功能：目标点绘制
        this.debugMode = false;
        this.debugGraphics = null;

        this.toggleDebug();
    }

    setBaseSpeed(speed){
        this.baseSpeed = speed;
    }

    onAdd(){
        GameApp.instance.ticker.add(this.update, this);
    }

    onDestroy(){
        GameApp.instance.ticker.remove(this.update, this);
    }

    get head() {
        return this.cubes[0];
    }

    setPosition(x, y) {
        this.head.x = x;
        this.head.y = y;
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
        return { x, y, rotation };
    }

    setName(name){
        this.name = name;
        this.updateName();
    }

    updateName(){
        if (!this.head) return;
        if (!this.nameTxt) {
            this.nameTxt = new PIXI.Text(this.name || '', {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 40,
                fill: 0xffff66, // 亮黄色
                stroke: 0x222222, // 深色描边
                strokeThickness: 5,
                align: 'center',
            });
            this.nameTxt.anchor.set(0.5, 1);
            this.head.addChild(this.nameTxt);

            this.nameTxt.x = 0;
            this.nameTxt.y = 0;
            this.nameTxt.rotation = Math.PI / 2; // 保持正向朝上
            this.nameTxt.visible = !!this.name;
        }
        this.nameTxt.text = this.name || '';
    }

    addCubes(values){
        values.forEach(value => {
            this.addCube(value);
        });
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
        newCube.setSnake(this);

        this.cubes.splice(idx, 0, newCube);
        this.addChild(newCube);
        this.updateCubeZOrder();
        this.onHeadValueChanged();
        this.updateName();
        return newCube;
    }

    onHeadValueChanged(){

    }

    update(delta) {
        this.updateNormalMovement(delta);
        // if (this.pendingMerge) {
        //     this.updateMergeAnimation(delta);
        // } else if (this.mergeCooldown && this.mergeCooldown > 0) {
        //     const dt = delta && delta.deltaMS ? delta.deltaMS : 16;
        //     this.mergeCooldown -= dt;
        //     if (this.mergeCooldown < 0) this.mergeCooldown = 0;
        // } else {
        //     this.mergeCubesIfPossible();
        // }
    }

    updateHeadDirectionStrategy(delta) { }

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
        
        // 添加安全检查，确保方向属性存在
        if (typeof this.targetDirectionX !== 'number' || typeof this.targetDirectionY !== 'number') {
            this.targetDirectionX = 1;
            this.targetDirectionY = 0;
        }
        
        const targetAngle = Math.atan2(this.targetDirectionY, this.targetDirectionX);
        const currentRotation = normalizeAnglePi(headCube.rotation);
        const angleDifference = shortestAngleDist(currentRotation, targetAngle);
        const rotationLerpFactor = 0.1;
        
        headCube.rotation += angleDifference * rotationLerpFactor * deltaTime;
        headCube.rotation = normalizeAnglePi(headCube.rotation);

        headCube.x += Math.cos(headCube.rotation) * this.finalSpeed * deltaTime;
        headCube.y += Math.sin(headCube.rotation) * this.finalSpeed * deltaTime;

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
            if (this.cubes.indexOf(pm.cubeA) === 0) {
                this.onHeadValueChanged();
            }
            this.pendingMerge = null;
            this.mergeCooldown = 200;
        }
    }

    updateSnakeLogic(deltaTime, excludeIndex = -1) {
        if (this.cubes.length < 2) return;
        
        // 清除之前的debug图形
        if (this.debugMode) {
            this.debugGraphics.clear();
        }
        
        // 从第二个cube开始，每个cube追逐前面的cube
        for (let i = 1; i < this.cubes.length; i++) {
            if (i === excludeIndex) continue;
            
            const follower = this.cubes[i];        // 当前cube（跟随者）
            const leader = this.cubes[i - 1];      // 前面的cube（领导者）
            
            // 计算理想跟随距离：直接使用follower的大小
            const followerSize = follower.getSize();
            const idealGap = followerSize * 0.7;
            
            // 计算目标位置（在leader后方idealGap距离处）
            const targetX = leader.x - Math.cos(leader.rotation) * idealGap;
            const targetY = leader.y - Math.sin(leader.rotation) * idealGap;
            
            // Debug绘制：目标点和连线
            if (this.debugMode) {
                // 绘制目标点（红色）
                this.drawTargetPoint(targetX, targetY, 0xff0000);
                // 绘制从follower到目标点的连线（绿色）
                this.drawLine(follower.x, follower.y, targetX, targetY, 0x00ff00);
                // 绘制从leader到目标点的连线（蓝色）
                this.drawLine(leader.x, leader.y, targetX, targetY, 0x0000ff);
            }
            
            // 统一追逐策略，使用更温和的旋转参数减少摆头
            const followSpeed = this.finalSpeed * follower.speedRatio * 1.5;
            
            // move and rotation
            {
                const dx = targetX - follower.x;
                const dy = targetY - follower.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 3) {
                    // 追逐状态：渐进追逐，朝向运动方向
                    
                    // 移动：渐进追逐目标点
                    const moveDist = Math.min(followSpeed * deltaTime, distance);
                    follower.x += (dx / distance) * moveDist;
                    follower.y += (dy / distance) * moveDist;
                    
                    // 朝向：跟随运动方向
                    const targetAngle = Math.atan2(dy, dx);
                    const angleDiff = shortestAngleDist(normalizeAnglePi(follower.rotation), targetAngle);
                    const rotationLerp = 0.1;
                    const rotationDiff = angleDiff * rotationLerp;
                    const rotation = normalizeAnglePi(follower.rotation + rotationDiff);
                    follower.rotation = rotation;
                } else {
                    // 到达状态：直接设置到目标点，朝向leader方向
                    
                    // 移动：直接设置到目标点
                    follower.x = targetX;
                    follower.y = targetY;
                    
                    // 朝向：跟随leader方向
                    const targetAngle = leader.rotation;
                    const angleDiff = shortestAngleDist(normalizeAnglePi(follower.rotation), targetAngle);
                    const rotationLerp = 0.1;
                    const rotationDiff = angleDiff * rotationLerp;
                    const rotation = normalizeAnglePi(follower.rotation + rotationDiff);
                    follower.rotation = rotation;
                }
            }
        }
    }


    updateCubeZOrder() {
        for (let i = 0; i < this.cubes.length; i++) {
            this.setChildIndex(this.cubes[i], this.cubes.length - 1 - i);
        }
    }

    splitAt(index) {
        const gameApp = GameApp.instance;
        const removed = this.cubes.splice(index);
        for (const cube of removed) {
            cube.setSnake(null);
            gameApp.addGameObject(cube, GameLayer.LooseCube);
        }
        if (index === 0) {
            gameApp.removeGameObject(this);
        }
    }

    /**
     * 切换debug模式
     */
    toggleDebug() {
        this.debugMode = !this.debugMode;
        if (this.debugMode) {
            this.initDebugGraphics();
        } else {
            this.clearDebugGraphics();
        }
    }

    /**
     * 初始化debug图形
     */
    initDebugGraphics() {
        if (!this.debugGraphics) {
            this.debugGraphics = new PIXI.Graphics();
            this.addChild(this.debugGraphics);
        }
    }

    /**
     * 清除debug图形
     */
    clearDebugGraphics() {
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        }
    }

    /**
     * 绘制目标点
     */
    drawTargetPoint(x, y, color = 0xff0000) {
        if (!this.debugMode || !this.debugGraphics) return;
        
        this.debugGraphics.beginFill(color);
        this.debugGraphics.drawCircle(x, y, 5);
        this.debugGraphics.endFill();
    }

    /**
     * 绘制连线
     */
    drawLine(fromX, fromY, toX, toY, color = 0x00ff00) {
        if (!this.debugMode || !this.debugGraphics) return;
        
        this.debugGraphics.lineStyle(2, color);
        this.debugGraphics.moveTo(fromX, fromY);
        this.debugGraphics.lineTo(toX, toY);
    }
}
