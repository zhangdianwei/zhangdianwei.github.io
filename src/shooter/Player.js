import * as PIXI from 'pixi.js';

import RifleWeapon from './RifleWeapon.js';

export default class Player extends PIXI.Container {
    constructor() {
        super();
        this.sprite = null;
        this.speed = 6; // 每帧最大移动速度
        this.turnSpeed = 0.15; // 每帧最大转向弧度
        this.angle = 0; // 当前朝向
        this.radius = 0; // 活动范围
        this.weapon = null;
    }

    async init(app) {
        this.radius = app.radius;
        this.sprite = PIXI.Sprite.from('shooter/ship_E.png');
        this.sprite.anchor.set(0.5);
        this.addChild(this.sprite);
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.weapon = new RifleWeapon(this);
        this.addChild(this.weapon);
    }

    updateWeapon(radius) {
        if (this.weapon) this.weapon.update(radius);
    }


    lookAt(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const targetAngle = Math.atan2(dy, dx);

        // 计算最短角度差，保持在[-π, π]
        let delta = targetAngle - this.angle;
        delta = ((delta + Math.PI) % (2 * Math.PI)) - Math.PI;

        // if (Math.abs(delta) <= this.turnSpeed) {
        //     this.angle = targetAngle;
        // } else {
        //     this.angle += Math.sign(delta) * this.turnSpeed;
        // }
        this.angle = targetAngle;

        if (this.sprite) {
            this.sprite.rotation = this.angle;
        }
    }

    moveByKeys(keys, limitRadius) {
        let dx = 0, dy = 0;
        if (keys.w) dy -= 1;
        if (keys.s) dy += 1;
        if (keys.a) dx -= 1;
        if (keys.d) dx += 1;
        if (dx !== 0 || dy !== 0) {
            // 归一化方向
            let len = Math.sqrt(dx*dx + dy*dy);
            dx /= len; dy /= len;
            let moveX = dx * this.speed;
            let moveY = dy * this.speed;
            let nextX = this.x + moveX;
            let nextY = this.y + moveY;
            // 限制在圆内
            let r = Math.sqrt(nextX * nextX + nextY * nextY);
            let maxR = limitRadius !== undefined ? limitRadius : this.radius;
            if (r > maxR) {
                let scale = maxR / r;
                nextX *= scale;
                nextY *= scale;
            }
            this.x = nextX;
            this.y = nextY;
        }
    }
}
