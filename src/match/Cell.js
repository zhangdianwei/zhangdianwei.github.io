import * as PIXI from 'pixi.js';
import gameApp from './GameApp';
import * as planck from 'planck-js';

export default class Cell extends PIXI.Container {
    constructor() {
        super();
        this.bodies = []; // 存储所有小球物理体
        this.joints = []; // 存储所有关节
        this._colorIndex = 0; // 默认颜色索引
        this.ballSize = 30;
        this.centerBody = null; // 中心控制点
        this._isDestroyed = false; // 销毁状态
        this._highlighted = false; // 高亮状态
    }

    setPoints(points) {
        this.initBodies(points);
        this.initJoints();
    }

    getDisplayPoints() {
        if (this.bodies.length < 3) {
            return this.getBoundsForFewPoints();
        }

        // Calculate geometric center in PIXEL coordinates
        const centerX = this.bodies.reduce((sum, body) => sum + body.getPosition().x, 0) / this.bodies.length * gameApp.PPM;
        const centerY = this.bodies.reduce((sum, body) => sum + body.getPosition().y, 0) / this.bodies.length * gameApp.PPM;

        let boundsPoints = this.bodies.map(body => {
            const position = body.getPosition();
            const ballX = position.x * gameApp.PPM; // Convert to pixels for drawing logic
            const ballY = position.y * gameApp.PPM;

            // Vector from center to ball
            const dirX = ballX - centerX;
            const dirY = ballY - centerY;

            const dist = Math.sqrt(dirX * dirX + dirY * dirY);

            // If a ball is at the geometric center, we can't determine a direction.
            // This is unlikely with >2 balls unless they are all at the same spot.
            // We'll push it out along the Y axis as a fallback.
            if (dist < 0.001) {
                return { x: ballX, y: ballY + this.ballSize };
            }

            // Normalize vector
            const normX = dirX / dist;
            const normY = dirY / dist;

            // The point on the opposite side of the ball, along the ray from the center
            return {
                x: ballX + normX * this.ballSize * 1.0,
                y: ballY + normY * this.ballSize * 1.0
            };
        });

        // Sort points by angle around the geometric center to form a simple polygon
        boundsPoints.sort((a, b) => {
            const angleA = Math.atan2(a.y - centerY, a.x - centerX);
            const angleB = Math.atan2(b.y - centerY, b.x - centerX);
            return angleA - angleB;
        });

        return boundsPoints;
    }

    // 计算两点之间的距离
    distance(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }

    // 处理少于3个点的情况
    getBoundsForFewPoints() {
        if (this.bodies.length === 0) return [];

        if (this.bodies.length === 1) {
            // 单个小球，返回一个正方形
            const position = this.bodies[0].getPosition();
            const center = { x: position.x * gameApp.PPM, y: position.y * gameApp.PPM };
            const r = this.ballSize;
            return [
                { x: center.x - r, y: center.y - r },
                { x: center.x + r, y: center.y - r },
                { x: center.x + r, y: center.y + r },
                { x: center.x - r, y: center.y + r }
            ];
        }

        if (this.bodies.length === 2) {
            // 两个小球，返回一个矩形
            const pos1 = this.bodies[0].getPosition();
            const pos2 = this.bodies[1].getPosition();
            const p1 = { x: pos1.x * gameApp.PPM, y: pos1.y * gameApp.PPM };
            const p2 = { x: pos2.x * gameApp.PPM, y: pos2.y * gameApp.PPM };
            const r = this.ballSize;

            // 计算两个小球中心之间的距离
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance === 0) {
                // 两个小球重叠，返回正方形
                return [
                    { x: p1.x - r, y: p1.y - r },
                    { x: p1.x + r, y: p1.y - r },
                    { x: p1.x + r, y: p1.y + r },
                    { x: p1.x - r, y: p1.y + r }
                ];
            }

            // 计算垂直于连接线的单位向量
            const perpX = -dy / distance;
            const perpY = dx / distance;

            // 返回矩形的四个角点
            return [
                { x: p1.x + perpX * r, y: p1.y + perpY * r },
                { x: p1.x - perpX * r, y: p1.y - perpY * r },
                { x: p2.x - perpX * r, y: p2.y - perpY * r },
                { x: p2.x + perpX * r, y: p2.y + perpY * r }
            ];
        }

        return [];
    }

    get colorIndex() {
        return this._colorIndex;
    }

    set colorIndex(value) {
        this._colorIndex = value;
    }

    get color() {
        return gameApp.colors[this.colorIndex];
    }

    // 设置高亮状态
    setHighlight(highlighted) {
        this._highlighted = highlighted;
    }

    // 获取高亮状态
    get highlighted() {
        return this._highlighted || false;
    }

    // 初始化小球物理体
    initBodies(initialPoints) {
        // 清理之前的物理体
        this.cleanupBodies();

        // 为每个点创建小球
        initialPoints.forEach((point) => {
            const body = gameApp.physicsWorld.createBody({
                type: planck.Body.DYNAMIC,
                position: new planck.Vec2(point.x / gameApp.PPM, point.y / gameApp.PPM)
            });

            const circle = new planck.Circle(this.ballSize / gameApp.PPM);
            body.createFixture({
                shape: circle,
                density: 1.0,
                friction: 0.3,
                restitution: 0.5
            });

            this.bodies.push(body);
        });

    }

    // 初始化关节连接
    initJoints() {

        // 清理之前的关节
        this.cleanupJoints();

        const bodies = this.bodies;
        if (bodies.length < 2) return;

        // 连接相邻的小球
        for (let i = 0; i < bodies.length; i++) {
            const bodyA = bodies[i];
            const bodyB = bodies[(i + 1) % bodies.length]; // 循环连接

            const joint = new planck.DistanceJoint({
                bodyA: bodyA,
                bodyB: bodyB,
                localAnchorA: new planck.Vec2(0, 0),
                localAnchorB: new planck.Vec2(0, 0),
                frequencyHz: 5.0,   // 启用弹簧，让连接更自然
                dampingRatio: 0.7   // 增加阻尼，减少振荡
            });

            gameApp.physicsWorld.createJoint(joint);
            this.joints.push(joint);
        }
    }

    // 清理物理体
    cleanupBodies() {
        this.bodies.forEach(body => {
            if (body && body.getWorld()) {
                body.getWorld().destroyBody(body);
            }
        });
        this.bodies = [];
    }

    // 清理关节
    cleanupJoints() {
        this.joints.forEach(joint => {
            if (joint && joint.getWorld()) {
                joint.getWorld().destroyJoint(joint);
            }
        });
        this.joints = [];
    }

    destroy() {
        this.cleanupBodies();
        this.cleanupJoints();
        this._isDestroyed = true;
    }

    playBreakAnim() {
        // 播放破碎动画
        if (gameApp.animationManager) {
            gameApp.animationManager.playCellBreakAnim(this);
        }
    }

    get isDestroyed() {
        return this._isDestroyed;
    }

    set isDestroyed(value) {
        this._isDestroyed = value;
    }
}