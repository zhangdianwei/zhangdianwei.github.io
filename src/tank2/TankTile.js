import * as PIXI from 'pixi.js';
import { TankApp } from './TankApp.js';

export default class TankTile extends PIXI.Container {
    constructor(row, col, type) {
        super();
        
        this.row = row;
        this.col = col;
        this.type = type;
        this.tankApp = TankApp.instance;
        this.tileSize = 32;
        
        this.createSprite();
        this.setPosition();
    }
    
    createSprite() {
        // 根据类型创建不同的精灵
        switch (this.type) {
            case 1: // 砖块
                this.sprite = new PIXI.Sprite(this.tankApp.textures['tank2/bigtile_1.png']);
                break;
            case 2: // 铁块
                this.sprite = new PIXI.Sprite(this.tankApp.textures['tank2/bigtile_2.png']);
                break;
            case 3: // 水面
                this.sprite = new PIXI.Sprite(this.tankApp.textures['tank2/bigtile_3.png']);
                break;
            case 4: // 草地
                this.sprite = new PIXI.Sprite(this.tankApp.textures['tank2/bigtile_4.png']);
                break;
            case 5: // 老窝
                this.sprite = new PIXI.Sprite(this.tankApp.textures['tank2/bigtile_5.png']);
                break;
            case 6: // 基地
                this.sprite = new PIXI.Sprite(this.tankApp.textures['tank2/bigtile_6.png']);
                break;
            default:
                // 默认使用Graphics绘制
                this.sprite = new PIXI.Graphics();
                this.sprite.beginFill(0x808080);
                this.sprite.drawRect(0, 0, this.tileSize, this.tileSize);
                this.sprite.endFill();
        }
        
        this.sprite.width = this.tileSize;
        this.sprite.height = this.tileSize;
        this.addChild(this.sprite);
    }
    
    setPosition() {
        this.x = this.col * this.tileSize;
        this.y = this.row * this.tileSize;
    }
    
    // 设置瓦片类型（用于动态改变）
    setType(newType) {
        this.type = newType;
        this.removeChild(this.sprite);
        this.createSprite();
        this.setPosition();
    }
    
    // 获取瓦片类型
    getType() {
        return this.type;
    }
    
    // 检查是否可通行
    isWalkable() {
        return this.type === 0 || this.type === 4; // 空地或草地可通行
    }
    
    // 检查是否可破坏
    isDestructible() {
        return this.type === 1; // 只有砖块可破坏
    }
    
    // 检查是否是基地
    isBase() {
        return this.type === 6;
    }
    
    // 销毁瓦片
    destroy() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}