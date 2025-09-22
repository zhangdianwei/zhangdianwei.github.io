import * as PIXI from 'pixi.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import { TankApp } from './TankApp.js';
import { TileSize } from './TileType.js';

export default class TankHome extends PIXI.Container {
    constructor() {
        super();
        
        this.tankApp = TankApp.instance;
        this.textures = this.tankApp.textures;
        
        this.isDead = false;
        this.size = TileSize * 2; // 基地大小为2x2个瓦片
        
        this.createSprite();
    }

    createSprite() {
        // 创建基地精灵（使用一张2x2的大图）
        this.sprite = PIXI.Sprite.from('tank2/bigtile_6.png');
        this.sprite.width = this.size;
        this.sprite.height = this.size;
        this.sprite.anchor.set(0.5, 0.5);
        this.addChild(this.sprite);
    }

    takeDamage(damage) {
        if (this.isDead) return;
        
        this.isDead = true;
        this.changeToDestroyedSprite();
        this.addExplodeEffect();
    }

    changeToDestroyedSprite() {
        // 替换为被摧毁的基地图像
        this.sprite.texture = PIXI.Texture.from('tank2/bigtile_7.png');
    }

    addExplodeEffect() {
        // 添加爆炸效果
        const explodeEffect = createSpriteSeqAnim('tankExplode', () => {
            this.tankApp.ui.onHomeDeadFinish(this);
        });
        explodeEffect.x = 0;
        explodeEffect.y = 0;
        this.addChild(explodeEffect);
    }

    getBounds() {
        return {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
            width: this.size,
            height: this.size
        };
    }

    // 检查点是否在基地范围内
    checkCollision(x, y) {
        const bounds = this.getBounds();
        return x >= bounds.x && x <= bounds.x + bounds.width && 
               y >= bounds.y && y <= bounds.y + bounds.height;
    }
}