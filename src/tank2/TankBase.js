import * as PIXI from 'pixi.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import { TankApp } from './TankApp.js';
import { Dir } from './TileType.js';
import Bullet from './Bullet.js';

export default class TankBase extends PIXI.Container {
    constructor() {
        super();
        
        this.tankApp = TankApp.instance;
        this.textures = this.tankApp.textures;

        this.speed = 2;
        this.direction = Dir.UP;

        this.health = 1;
        
        this.isMoving = false;
        this.isShooting = false;
        this.shootOnce = false;

        this.invincibleTime = 0;
        
        this.animationTimer = 0;
        this.currentFrame = 0;
        this.animationSpeed = 0.15;
        
        this.shootTimer = 0;
        this.shootCooldown = 0.3;
        
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
    
    takeDamage(damage = 1) {
        
    }

    checkMoving(deltaTime){
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
}