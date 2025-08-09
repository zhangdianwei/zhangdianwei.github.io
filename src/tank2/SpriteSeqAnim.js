import * as PIXI from 'pixi.js';

export default class SpriteSeqAnim extends PIXI.Container {
    constructor(img_name, count) {
        super();
        
        this.img_name = img_name;
        this.count = count;
        this.currentFrame = 0;
        this.isPlaying = false;
        this.frameRate = 8; // 每秒帧数
        this.frameTime = 1 / this.frameRate;
        this.accumulator = 0;
        
        this.sprites = [];
        this.createSprites();
        
        // 默认隐藏所有精灵
        this.visible = false;
    }
    
    createSprites() {
        for (let i = 1; i <= this.count; i++) {
            const texture = PIXI.Texture.from(`tank2/${this.img_name}_${i}.png`);
            const sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5);
            sprite.visible = false;
            this.sprites.push(sprite);
            this.addChild(sprite);
        }
    }
    
    play() {
        this.isPlaying = true;
        this.currentFrame = 0;
        this.accumulator = 0;
        this.visible = true;
        this.updateFrame();
    }
    
    stop() {
        this.isPlaying = false;
        this.visible = false;
        this.hideAllSprites();
    }
    
    update(deltaTime) {
        if (!this.isPlaying) return;
        
        this.accumulator += deltaTime;
        
        if (this.accumulator >= this.frameTime) {
            this.accumulator -= this.frameTime;
            this.currentFrame++;
            
            if (this.currentFrame >= this.count) {
                this.currentFrame = 0; // 循环播放
            }
            
            this.updateFrame();
        }
    }
    
    updateFrame() {
        this.hideAllSprites();
        if (this.currentFrame < this.sprites.length) {
            this.sprites[this.currentFrame].visible = true;
        }
    }
    
    hideAllSprites() {
        this.sprites.forEach(sprite => {
            sprite.visible = false;
        });
    }
    
    setOnComplete(callback) {
        this.onComplete = callback;
    }
} 