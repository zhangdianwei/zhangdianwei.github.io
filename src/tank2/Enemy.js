import * as PIXI from 'pixi.js';
import SpriteSeqAnim from './SpriteSeqAnim.js';

export default class Enemy extends PIXI.Container {
    constructor(type, textures) {
        super();
        
        this.type = type;
        this.textures = textures;
        this.speed = 1;
        this.direction = 0; // 0: 上, 1: 右, 2: 下, 3: 左
        this.isMoving = false;
        this.health = 1;
        this.animationTimer = 0;
        this.currentFrame = 0;
        this.aiTimer = 0;
        this.shootTimer = 0;
        
        this.createSprites();
        this.setupAnimations();
    }
    
    createSprites() {
        // 创建敌人坦克精灵
        this.tankSprite = new PIXI.Sprite(this.textures[`tank2/enermys/enermy_${this.type}_run_1.png`]);
        this.tankSprite.anchor.set(0.5);
        this.tankSprite.visible = false;
        this.addChild(this.tankSprite);
        
        // 创建出现动画
        this.bornAnim = new SpriteSeqAnim('born', 6);
        this.bornAnim.setOnComplete(() => {
            this.bornAnim.visible = false;
            this.tankSprite.visible = true;
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
        this.animationSpeed = 0.15;
        this.aiUpdateInterval = 2; // AI更新间隔
        this.shootInterval = 3; // 射击间隔
    }
    
    spawn() {
        this.bornAnim.play();
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
        const textureName = `tank2/enermys/enermy_${this.type}_run_${frame + 1}.png`;
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
        this.health -= damage;
        
        if (this.health <= 0) {
            this.explode();
            return true;
        }
        
        return false;
    }
    
    updateAI(deltaTime, levelData) {
        this.aiTimer += deltaTime;
        this.shootTimer += deltaTime;
        
        // AI行为更新
        if (this.aiTimer >= this.aiUpdateInterval) {
            this.aiTimer = 0;
            
            // 随机改变方向
            if (Math.random() < 0.3) {
                this.setDirection(Math.floor(Math.random() * 4));
            }
            
            // 尝试移动
            const radians = (this.direction * 90) * Math.PI / 180;
            const dx = Math.sin(radians) * this.speed;
            const dy = -Math.cos(radians) * this.speed;
            
            const newX = this.x + dx;
            const newY = this.y + dy;
            
            // 检查是否可以移动
            const tileSize = 32;
            const col = Math.floor(newX / tileSize);
            const row = Math.floor(newY / tileSize);
            
            if (levelData.isWalkable(row, col)) {
                this.move(this.direction);
            } else {
                // 碰到障碍物，随机改变方向
                this.setDirection(Math.floor(Math.random() * 4));
            }
        }
        
        // 射击
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            this.emit('shoot', this.direction);
        }
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