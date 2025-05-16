import * as PIXI from 'pixi.js';
import ShooterObjBase, { ShowLayer } from './ShooterObjBase.js';

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
        this._tickManager = window.shooterApp.tickManager;
        if (this._tickManager) {
            this._tickUpdate = this.update.bind(this);
            this._tickManager.register(this._tickUpdate);
        }
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

}
