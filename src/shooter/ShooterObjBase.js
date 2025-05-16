import * as PIXI from 'pixi.js';
import * as SAT from "sat"

export const ShowLayer = Object.freeze({
    BG: 0,
    ENEMY: 1,
    PLAYER: 2,
    BULLET: 3,
    EFFECT: 4,
    UI: 5,
});

export default class ShooterObjBase extends PIXI.Container {
    constructor() {
        super();
        this.ShowLayer = ShowLayer.BG; // 默认背景层，子类应重写

        this.on('added', this.onAdd.bind(this));
        this.on('removed', this.onRemoved.bind(this));
    }

    onAdd(){
        window.shooterApp.tickManager.register(this.update.bind(this), this);
    }
    onRemoved(oldParent){
        window.shooterApp.tickManager.unregisterByObj(this);
    }

    update(){
    }

    // SAT.js碰撞体，默认圆形（可被子类重写）
    getCollider() {
        // 以 this.x, this.y 为中心，半径 this.radius
        const r = this.radius || (this.width ? this.width/2 : 10);
        return new SAT.Circle(new SAT.Vector(this.x, this.y), r);
    }
    // 碰撞回调，子类可重写
    onCollide(other) {
        // 默认无操作
    }

    // 显示层
    get ShowLayer(){
        return this._ShowLayer;
    }
    set ShowLayer(value){
        this._ShowLayer = value;
    }

    isOutOfCircle(radius) {
        return (this.x * this.x + this.y * this.y) > radius * radius;
    }
}
