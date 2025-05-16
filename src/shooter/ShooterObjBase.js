import * as PIXI from 'pixi.js';

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
    }

    onAdd(){

    }
    onDestroy(){
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
