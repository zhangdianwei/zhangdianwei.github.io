import * as PIXI from 'pixi.js';
import { TankApp } from './TankApp.js';

export default class Bullet extends PIXI.Container {
    constructor(owner) {
        super();
        
        this.tankApp = TankApp.instance;

        this.owner = owner; // 发射者（玩家或敌人）
        this.direction = owner.direction; // 0: 上, 1: 右, 2: 下, 3: 左
        this.power = 1; // 子弹威力
        this.speed = 4;
        this.size = 20;

        this.x = this.owner.x;
        this.y = this.owner.y;
        
        this.createSprite();
        this.addToGame();
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
    
    addToGame() {
        this.tankApp.logic.addBullet(this);
    }
    
    update(deltaTime) {
        console.log(this.direction);
        
        // 移动子弹
        switch (this.direction) {
            case 0: // 上
                this.y -= this.speed;
                break;
            case 1: // 右
                this.x += this.speed;
                break;
            case 2: // 下
                this.y += this.speed;
                break;
            case 3: // 左
                this.x -= this.speed;
                break;
        }
        
        // 检查边界
        if (!this.tankApp.logic.isInBounds(this.x, this.y)) {
            this.destroy();
        }
    }
    
    destroy() {
        this.tankApp.logic.removeBullet(this);
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
    
    // 检查与其他对象的碰撞
    checkCollision(object) {
        
        const bulletBounds = this.getBounds();
        const objectBounds = object.getBounds ? object.getBounds() : object;
        
        return (
            bulletBounds.x < objectBounds.x + objectBounds.width &&
            bulletBounds.x + bulletBounds.width > objectBounds.x &&
            bulletBounds.y < objectBounds.y + objectBounds.height &&
            bulletBounds.y + bulletBounds.height > objectBounds.y
        );
    }
} 