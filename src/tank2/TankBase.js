import * as PIXI from 'pixi.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import { TankApp } from './TankApp.js';
import { Dir, moveByDir, TileSize, TankType, TankConfig } from './TileType.js';
import Bullet from './Bullet.js';

export default class TankBase extends PIXI.Container {
    constructor(tankType) {
        super();
        
        this.tankApp = TankApp.instance;
        this.textures = this.tankApp.textures;

        this.tankType = tankType;
        this.direction = Dir.UP;
        this.size = 64;

        this.isMoving = false;
        this.isShooting = false;
        this.shootOnce = false;

        this.invincibleTime = 0;
        
        this.animationTimer = 0;
        this.currentFrame = 0;
        this.animationSpeed = 0.15;
        
        this.shootTimer = 0;
        this.shootCooldown = 0.15;
        
        this.maxBullets = 1; // 最大子弹数量
        this.currentBullets = 0; // 当前子弹数量

        this.initByTankType(tankType);
    }

    initByTankType(tankType){
        this.tankType = tankType;
        
        const config = TankConfig[tankType] || TankConfig[TankType.PLAYER];
        this.speed = config.speed;
        this.health = config.health;
        this.power = config.power;

        this.initSprites();
    }

    initSprites() {
        this.tankSprites = [];
        
        let texturePrefix;
        if (this.tankType === TankType.PLAYER) {
            texturePrefix = 'tank2/player1_run_';
        } else {
            texturePrefix = `tank2/enermys/enermy_${this.tankType}_run_`;
        }
        
        for (let i = 1; i <= 2; i++) {
            const sprite = PIXI.Sprite.from(this.textures[`${texturePrefix}${i}.png`]);
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
    
    setDirection(direction) {
        this.direction = direction;
        this.tankSprites.forEach(sprite => sprite.rotation = direction * (Math.PI / 2));
    }
    
    setMoving(moving) {
        this.isMoving = moving;
    }

    setShooting(shooting) {
        this.isShooting = shooting;
    }

    setShootOnce() {
        this.shootOnce = true;
    }

    shoot(){
        const bullet = new Bullet(this);
        return bullet;
    }

    onBulletAdded(bullet) {
        // 子弹被添加时调用，增加子弹计数
        this.currentBullets++;
    }

    onBulletDestroyed() {
        // 子弹被销毁时调用，减少子弹计数
        if (this.currentBullets > 0) {
            this.currentBullets--;
        }
    }
    
    checkCorrectPath(){
        const size = TileSize/2;
        const centerX = Math.round(this.x / size) * size;
        const centerY = Math.round(this.y / size) * size;
        this.x = centerX;
        this.y = centerY;
    }

    checkMoving(deltaTime){
        if (this.isMoving) {
            let allowed = this.tankApp.levelData.getMovableDistance(this.getBounds(), this.direction);
            if (allowed <= 0) {
                this.checkCorrectPath();
                allowed = this.tankApp.levelData.getMovableDistance(this.getBounds(), this.direction);
            }
            let allowed2 = this.tankApp.logic.getMovableDistance(this.getBounds(), this.direction, this);
            if (this == this.tankApp.player) {
                console.log('allowed', allowed, 'allowed2', allowed2);
            }
            allowed = Math.min(allowed, allowed2);
            let frameSpeed = this.speed * deltaTime;
            let movable = Math.min(allowed, frameSpeed);
            
            if (movable > 0) {
                moveByDir(this, this.direction, movable);
            }
        }

        if (this.isMoving) {
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                this.enterNextFrame();
            }
        }
    }

    checkShooting(deltaTime){
        if (this.shootTimer > 0) {
            this.shootTimer -= deltaTime;
        }

        if (this.shootTimer > 0) return;

        if (this.currentBullets >= this.maxBullets) {
            return;
        }
        
        if (this.isShooting || this.shootOnce) {
            this.shootOnce = false;
            this.shootTimer = this.shootCooldown;
            this.shoot();
        }
    }

    checkInvincible(deltaTime){
        if (this.invincibleTime > 0) {
            this.invincibleTime -= deltaTime;
            this.alpha = Math.sin(Date.now() * 0.01) > 0 ? 1 : 0.5;
        } else {
            this.alpha = 1;
        }
    }

    takeDamage(damage) {
        if (this.invincibleTime > 0) return; // 无敌状态下不受伤害
        
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        this.tankApp.addEffect('tankExplode', this.x, this.y);
    }
    
    update(deltaTime) {
        this.checkMoving(deltaTime);
        this.checkShooting(deltaTime);
        this.checkInvincible(deltaTime);
    }
    
    setCurrentFrame(frame){
        this.tankSprites.forEach((sprite, index) => {
            sprite.visible = index === frame;
        });
        this.currentFrame = frame;
    }
    enterNextFrame(){
        this.setCurrentFrame((this.currentFrame + 1) % this.tankSprites.length);
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.size,
            height: this.size
        };
    }
}