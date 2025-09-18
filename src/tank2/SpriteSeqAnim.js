import * as PIXI from 'pixi.js';

const gAnimDef = {
    "tankAppear": {
        "pattern": "born_",
        "frameCount": 6,
        "totalCount": 3,
        "frameRate": 0.1
    },
    "tankExplode": {
        "pattern": "explode_",
        "frameCount": 3,
        "totalCount": 1,
        "frameRate": 8
    }
}

export class SpriteSeqAnim extends PIXI.Container {
    constructor(config = {}) {
        super();
        
        const {
            imgNamePattern = 'born_',
            frameCount = 1,
            frameRate = 8,
            basePath = 'tank2',
            totalCount = 1,
            onComplete = null
        } = config;

        this.imgNamePattern = imgNamePattern;
        this.frameCount = frameCount;
        this.basePath = basePath;
        this.totalCount = totalCount; // 要播放的轮数，默认无限循环
        this.playedRounds = 0;       // 已经播放完成的轮数
        this.currentFrame = 0;
        this.isPlaying = false;
        this.frameRate = frameRate; // 每秒帧数
        this.frameTime = 1 / this.frameRate;
        this.accumulator = 0;
        this.onComplete = onComplete;  // 播放完成后的回调
        
        this.sprites = [];
        this.createSprites();
        
        // 默认隐藏所有精灵
        this.visible = false;
    }
    
    createSprites() {
        for (let i = 1; i <= this.frameCount; i++) {
            const texture = PIXI.Texture.from(`${this.basePath}/${this.imgNamePattern}${i}.png`);
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
        this.playedRounds = 0;
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
        
        let updated = false;
        while (this.accumulator >= this.frameTime) {
            this.accumulator -= this.frameTime;
            this.currentFrame++;
            updated = true;
            
            if (this.currentFrame >= this.frameCount) {
                this.currentFrame = 0;
                this.playedRounds++;
                // 达到总轮数后停止并回调
                if (this.playedRounds >= this.totalCount) {
                    this.stop();
                    if (typeof this.onComplete === 'function') {
                        this.removeFromParent();
                        this.onComplete();
                    }
                    return;
                }
            }
        }
        if (updated) {
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
    
    setOnComplete(onComplete) {
        this.onComplete = onComplete;
    }
}

export function createSpriteSeqAnim(animName, callback) {
    const def = gAnimDef[animName] || {};
    const seq = new SpriteSeqAnim({
        imgNamePattern: def.pattern ?? 'born_',
        frameCount: def.frameCount ?? 1,
        frameRate: def.frameRate ?? 8,
        totalCount: def.totalCount ?? 1,
        basePath: def.basePath ?? 'tank2',
        onComplete: callback || null
    });
    seq.play();
    return seq;
}
