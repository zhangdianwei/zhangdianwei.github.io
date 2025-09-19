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
        this.isDestroyed = false;
        
        this.createSprite();
        this.addToGame();
    }
    
    createSprite() {
        // 创建子弹精灵
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xFFFF00); // 黄色子弹
        graphics.drawRect(-2, -2, 4, 4);
        graphics.endFill();
        
        this.sprite = graphics;
        this.sprite.anchor.set(0.5);
        this.addChild(this.sprite);
        
        // 根据方向旋转子弹
        const rotation = (this.direction * 90) * Math.PI / 180;
        this.sprite.rotation = rotation;
    }
    
    addToGame() {
        this.tankApp.logic.addBullet(this);
    }
    
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        // 移动子弹
        const radians = (this.direction * 90) * Math.PI / 180;
        const dx = Math.sin(radians) * this.speed;
        const dy = -Math.cos(radians) * this.speed;
        
        this.x += dx;
        this.y += dy;
        
        // 检查边界
        if (this.x < 0 || this.x > 832 || this.y < 0 || this.y > 768) {
            this.destroy();
        }
    }
    
    destroy() {
        this.isDestroyed = true;
        this.emit('destroyed');
    }
    
    getBounds() {
        return {
            x: this.x - 4,
            y: this.y - 4,
            width: 8,
            height: 8
        };
    }
    
    // 检查与其他对象的碰撞
    checkCollision(object) {
        if (this.isDestroyed) return false;
        
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