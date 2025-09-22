import * as PIXI from 'pixi.js';
import { TankApp } from './TankApp.js';
import { TileType } from './TileType.js';

export default class TankTile extends PIXI.Container {
    constructor(row, col, type) {
        super();
        
        this.row = row;
        this.col = col;
        this.type = type;
        this.tankApp = TankApp.instance;
        this.tileSize = 32;
        this.blood = 2;
        
        this.createSprite();
        this.setPosition();
    }

    getBlood() {
        return this.blood;
    }

    setBlood(blood) {
        this.blood = blood;
        if (this.blood == 1) {
            this.sprite.alpha = 0.5;
        }
    }
    
    createSprite() {
        // 根据类型创建不同的精灵
        switch (this.type) {
            case TileType.BRICK: // 砖块
                this.sprite = PIXI.Sprite.from('tank2/bigtile_1_tile_1.png');
                break;
            case TileType.IRON: // 铁块
                this.sprite = PIXI.Sprite.from('tank2/bigtile_2_tile_1.png');
                break;
            case TileType.WATER: // 水面
                this.sprite = PIXI.Sprite.from('tank2/bigtile_3_tile_1.png');
                break;
            case TileType.GRASS: // 草地
                this.sprite = PIXI.Sprite.from('tank2/bigtile_4_tile_1.png');
                break;
            case TileType.BASE: // 老窝
                this.sprite = PIXI.Sprite.from('tank2/bigtile_5_tile_1.png');
                break;
            case TileType.BASE: // 基地
                this.sprite = PIXI.Sprite.from('tank2/bigtile_6.png');
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

    // 销毁瓦片
    makeDead() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}