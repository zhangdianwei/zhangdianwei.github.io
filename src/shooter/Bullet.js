import * as PIXI from 'pixi.js';
import ShooterObjBase, { ShowLayer } from './ShooterObjBase.js';

import { CollisionLayer } from './ShooterObjBase.js';

export default class Bullet extends ShooterObjBase {
    constructor(x, y, angle, speed = 10) {
        super();
        this.ShowLayer = ShowLayer.BULLET;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alive = true;
        this.sprite = PIXI.Sprite.from('shooter/bullet1.png');
        this.sprite.anchor.set(0.5);
        this.addChild(this.sprite);
    }

    get collisionLayer() {
        // 可根据实际类型返回 PLAYER_BULLET 或 ENEMY_BULLET
        return CollisionLayer.PLAYER_BULLET;
    }

    getCollider() {
        // 用子弹精灵宽度为半径
        const r = this.sprite ? (this.sprite.width / 2) : 5;
        return new SAT.Circle(new SAT.Vector(this.x, this.y), r);
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

}
