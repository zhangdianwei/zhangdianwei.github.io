import * as PIXI from 'pixi.js';
import * as SAT from "sat"

export const CollisionLayer = Object.freeze({
    ALL: 0,
    PLAYER: 1,
    PLAYER_BULLET: 2,
    ENEMY: 3,
    ENEMY_BULLET: 4,
});

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

    get collisionLayer(){
        return CollisionLayer.ALL;
    }

    getCollider() {
        return null;
    }

    onAdd(){
        window.shooterApp.tickManager.register(this.update.bind(this), this);
    }
    onRemoved(oldParent){
        window.shooterApp.tickManager.unregisterByObj(this);
    }

    update(){
    }

    // 碰撞回调，子类可重写
    onCollide(other) {
        console.log("onCollide", this, other)
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
