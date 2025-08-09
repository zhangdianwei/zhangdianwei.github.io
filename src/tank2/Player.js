import * as PIXI from 'pixi.js';
import SpriteSeqAnim from './SpriteSeqAnim.js';

export default class Player extends PIXI.Container {
    constructor(textures) {
        super();
        
        this.textures = textures;
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
        
        // 创建出现动画
        this.bornAnim = new SpriteSeqAnim('born', 6);
        this.bornAnim.setOnComplete(() => {
            this.bornAnim.visible = false;
            this.tankSprite.visible = true;
            this.isInvincible = false;
        });
        this.addChild(this.bornAnim);
        
        // 创建爆炸动画
        this.explodeAnim = new SpriteSeqAnim('explode', 3);
        this.explodeAnim.setOnComplete(() => {
            this.emit('destroyed');
        });
        this.addChild(this.explodeAnim);
    }
    
    setupAnimations() {
        this.animationSpeed = 0.15; // 动画切换速度
    }
    
    spawn() {
        this.bornAnim.play();
        this.isInvincible = true;
        this.invincibleTime = 3; // 3秒无敌时间
    }
    
    explode() {
        this.tankSprite.visible = false;
        this.explodeAnim.play();
    }
    
    setDirection(direction) {
        this.direction = direction;
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
        
        // 更新动画
        if (this.bornAnim) {
            this.bornAnim.update(deltaTime);
        }
        if (this.explodeAnim) {
            this.explodeAnim.update(deltaTime);
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