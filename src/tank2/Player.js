import * as PIXI from 'pixi.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import { TankApp } from './TankApp.js';
import { Dir } from './TileType.js';

export default class Player extends PIXI.Container {
    constructor() {
        super();
        
        this.tankApp = TankApp.instance;
        this.textures = this.tankApp.textures;
        this.speed = 2;
        this.direction = 0; // 0: 上, 1: 右, 2: 下, 3: 左
        this.isMoving = false;
        this.health = 1;
        this.isInvincible = false;
        this.invincibleTime = 0;
        this.animationTimer = 0;
        this.currentFrame = 0;
        
        this.createSprites();
        this.setupAnimations();
    }
    
    createSprites() {
        // 创建玩家坦克精灵
        this.tankSprite = new PIXI.Sprite(this.textures['tank2/player1_run_1.png']);
        this.tankSprite.anchor.set(0.5);
        this.tankSprite.visible = false;
        this.addChild(this.tankSprite);
    }
    
    setupAnimations() {
        this.animationSpeed = 0.15; // 动画切换速度
    }
    
    spawn() {
        // 无敌时间仍由 Player 控制，出现动画逻辑已移至 TankLevelData
        this.isInvincible = true;
        this.invincibleTime = 3; // 3秒无敌时间
    }
    
    explode() {
        this.tankSprite.visible = false;
        // 使用临时变量创建并播放爆炸动画，播放完成后触发销毁事件并移除自身
        const explodeAnim = createSpriteSeqAnim('tankExplode', () => {
            this.emit('destroyed');
            if (explodeAnim.parent) {
                explodeAnim.parent.removeChild(explodeAnim);
            }
        });
        this.addChild(explodeAnim);
    }
    
    setDirection(direction) {
        this.direction = direction;
        this.tankSprite.rotation = direction * (Math.PI / 2);
        this.updateSprite();
    }
    
    updateSprite() {
        const frame = this.isMoving ? this.currentFrame : 0;
        const textureName = `tank2/player1_run_${frame + 1}.png`;
        if (this.textures[textureName]) {
            this.tankSprite.texture = this.textures[textureName];
        }
    }
    
    move(direction) {
        this.setDirection(direction);
        this.isMoving = true;
        
        const radians = (direction * 90) * Math.PI / 180;
        const dx = Math.sin(radians) * this.speed;
        const dy = -Math.cos(radians) * this.speed;
        
        this.x += dx;
        this.y += dy;
    }
    
    stop() {
        this.isMoving = false;
    }
    
    takeDamage(damage = 1) {
        if (this.isInvincible) return false;
        
        this.health -= damage;
        
        if (this.health <= 0) {
            this.explode();
            return true;
        }
        
        // 受伤闪烁效果
        this.isInvincible = true;
        this.invincibleTime = 1;
        
        return false;
    }
    
    update(deltaTime) {
        // 更新动画
        if (this.isMoving) {
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % 2;
                this.updateSprite();
            }
        } else {
            this.currentFrame = 0;
            this.updateSprite();
        }
        
        // 更新无敌时间
        if (this.isInvincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.isInvincible = false;
            }
            
            // 闪烁效果
            this.alpha = Math.sin(Date.now() * 0.01) > 0 ? 1 : 0.5;
        } else {
            this.alpha = 1;
        }
        
    }
    
    getBounds() {
        return {
            x: this.x - 16,
            y: this.y - 16,
            width: 32,
            height: 32
        };
    }
}