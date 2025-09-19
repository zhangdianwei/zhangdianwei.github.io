import * as PIXI from 'pixi.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import { TankApp } from './TankApp.js';
import { Dir } from './TileType.js';

export default class TankBase extends PIXI.Container {
    constructor() {
        super();
        
        this.tankApp = TankApp.instance;
        this.textures = this.tankApp.textures;

        this.speed = 2;
        this.direction = Dir.UP;

        this.health = 1;
        
        this.isMoving = false;

        this.invincibleTime = 0;
        
        this.animationTimer = 0;
        this.currentFrame = 0;
        this.animationSpeed = 0.15; // 动画切换速度
        
        this.initSprites();
    }
    
    initSprites() {
        this.tankSprites = [];
        for (let i = 1; i <= 2; i++) {
            const sprite = PIXI.Sprite.from(this.textures[`tank2/player1_run_${i}.png`]);
            sprite.anchor.set(0.5);
            sprite.visible = false;
            this.tankSprites.push(sprite);
            this.addChild(sprite);
        }
    }

    appear(){
        this.setInvincible();
        const appearAnim = createSpriteSeqAnim('tankAppear', () => {
            this.onAppearFinish();
        });
        this.addChild(appearAnim);
    }

    onAppearFinish(){
        this.setInvincible(false);
        this.enterNextFrame();
    }
    
    isInvincible() {
        return this.invincibleTime > 0;
    }
    setInvincible(invincibleTime = 3) {
        this.invincibleTime = invincibleTime;
    }
    
    explode() {
        this.tankSprites.forEach(sprite => sprite.visible = false);
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
        this.tankSprites.forEach(sprite => sprite.rotation = direction * (Math.PI / 2));
    }
    
    setMoving(moving) {
        this.isMoving = moving;
    }

    move(direction) {
        this.setDirection(direction);
        this.setMoving(true);
        
        const radians = (direction * 90) * Math.PI / 180;
        const dx = Math.sin(radians) * this.speed;
        const dy = -Math.cos(radians) * this.speed;
        
        this.x += dx;
        this.y += dy;
    }
    
    takeDamage(damage = 1) {
        
    }
    
    update(deltaTime) {
        // 自动移动逻辑
        if (this.isMoving) {
            const size = 64;
            const allowed = this.tankApp.levelData.getMovableDistance(this.x, this.y, size, size, this.direction);
            const movable = Math.min(allowed, this.speed);
            
            if (movable > 0) {
                const radians = (this.direction * 90) * Math.PI / 180;
                const dx = Math.sin(radians) * movable;
                const dy = -Math.cos(radians) * movable;
                this.x += dx;
                this.y += dy;
            } else {
                // 如果无法移动，停止移动状态
                this.setMoving(false);
            }
        }
        
        // 更新动画
        if (this.isMoving) {
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                this.enterNextFrame();
            }
        }
        
        // 更新无敌时间
        if (this.invincibleTime > 0) {
            this.invincibleTime -= deltaTime;
            this.alpha = Math.sin(Date.now() * 0.01) > 0 ? 1 : 0.5;
        } else {
            this.alpha = 1;
        }
        
    }
    
    setCurrentFrame(frame){
        this.tankSprites.forEach((sprite, index) => {
            sprite.visible = index === frame;
        });
        this.currentFrame = frame;
    }
    enterNextFrame(){
        this.setCurrentFrame((this.currentFrame + 1) % 2);
    }
}