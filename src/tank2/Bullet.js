import * as PIXI from 'pixi.js';
import { TankApp } from './TankApp.js';
import { moveByDir } from './TileType.js';

export default class Bullet extends PIXI.Container {
    constructor(owner) {
        super();
        
        this.tankApp = TankApp.instance;

        this.owner = owner; // 发射者（玩家或敌人）
        this.direction = owner.direction; // 0: 上, 1: 右, 2: 下, 3: 左
        this.power = 1; // 子弹威力
        this.speed = 400;
        this.size = 20;

        this.x = this.owner.x;
        this.y = this.owner.y;
        
        this.createSprite();

        this.tankApp.addBullet(this);
        
        // 通知坦克子弹被添加
        if (this.owner && this.owner.onBulletAdded) {
            this.owner.onBulletAdded(this);
        }
    }
    
    getPower() {
        return this.power;
    }
    setPower(power) {
        this.power = power;
    }

    getBlood() {
        return this.blood;
    }
    setBlood(blood) {
        this.blood = blood;
        if (this.blood <= 0) {
            this.destroy();
        }
    }

    createSprite() {
        // 创建子弹精灵
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xFFFF00); // 黄色子弹
        graphics.drawRect(-this.size/2, -this.size/2, this.size, this.size);
        graphics.endFill();
        
        this.sprite = graphics;
        this.addChild(this.sprite);
        
        // 根据方向旋转子弹
        const rotation = (this.direction * 90) * Math.PI / 180;
        this.sprite.rotation = rotation;
    }
    
    update(deltaTime) {
        moveByDir(this, this.direction, this.speed * deltaTime);
        
        // 检查边界
        if (!this.tankApp.logic.isInBounds(this.x, this.y)) {
            this.destroy();
        }
    }
    
    destroy() {
        // 通知坦克子弹被销毁
        if (this.owner && this.owner.onBulletDestroyed) {
            this.owner.onBulletDestroyed();
        }
        
        this.tankApp.removeBullet(this);
    }
    
    getBounds() {
        const size = this.size * 1;
        return {
            x: this.x,
            y: this.y,
            width: size,
            height: size
        };
    }
    
} 