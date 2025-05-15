import * as PIXI from 'pixi.js';

export default class Bullet extends PIXI.Graphics {
    constructor(x, y, angle, speed = 14) {
        super();
        this.beginFill(0xffe066);
        this.lineStyle(2, 0xffa500);
        this.drawCircle(0, 0, 7);
        this.endFill();
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alive = true;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    isOutOfCircle(radius) {
        return (this.x * this.x + this.y * this.y) > radius * radius;
    }
}
