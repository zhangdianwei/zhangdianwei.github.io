import * as PIXI from 'pixi.js';

export default class TetrisSprite9 extends PIXI.Container {
    constructor(texture, targetWidth, targetHeight, leftWidth, topHeight, rightWidth, bottomHeight) {
        super();
        this.texture = texture;
        this.targetWidth = targetWidth;
        this.targetHeight = targetHeight;
        this.leftWidth = leftWidth;
        this.topHeight = topHeight;
        this.rightWidth = rightWidth;
        this.bottomHeight = bottomHeight;
        
        this.sprites = {};
        this.init();
    }
    
    init() {
        const textureWidth = this.texture.width;
        const textureHeight = this.texture.height;
        const centerWidth = textureWidth - this.leftWidth - this.rightWidth;
        const centerHeight = textureHeight - this.topHeight - this.bottomHeight;
        
        const scaleX = (this.targetWidth - this.leftWidth - this.rightWidth) / centerWidth;
        const scaleY = (this.targetHeight - this.topHeight - this.bottomHeight) / centerHeight;
        
        const regions = {
            topLeft: new PIXI.Rectangle(0, 0, this.leftWidth, this.topHeight),
            topRight: new PIXI.Rectangle(textureWidth - this.rightWidth, 0, this.rightWidth, this.topHeight),
            bottomLeft: new PIXI.Rectangle(0, textureHeight - this.bottomHeight, this.leftWidth, this.bottomHeight),
            bottomRight: new PIXI.Rectangle(textureWidth - this.rightWidth, textureHeight - this.bottomHeight, this.rightWidth, this.bottomHeight),
            top: new PIXI.Rectangle(this.leftWidth, 0, centerWidth, this.topHeight),
            bottom: new PIXI.Rectangle(this.leftWidth, textureHeight - this.bottomHeight, centerWidth, this.bottomHeight),
            left: new PIXI.Rectangle(0, this.topHeight, this.leftWidth, centerHeight),
            right: new PIXI.Rectangle(textureWidth - this.rightWidth, this.topHeight, this.rightWidth, centerHeight),
            center: new PIXI.Rectangle(this.leftWidth, this.topHeight, centerWidth, centerHeight),
        };
        
        const offsetX = -this.targetWidth / 2;
        const offsetY = -this.targetHeight / 2;
        
        let x = offsetX;
        let y = offsetY;
        
        this.sprites.topLeft = this.createSprite(this.texture, regions.topLeft, x, y, this.leftWidth, this.topHeight);
        this.sprites.top = this.createSprite(this.texture, regions.top, x + this.leftWidth, y, centerWidth * scaleX, this.topHeight);
        this.sprites.topRight = this.createSprite(this.texture, regions.topRight, x + this.targetWidth - this.rightWidth, y, this.rightWidth, this.topHeight);
        
        y += this.topHeight;
        this.sprites.left = this.createSprite(this.texture, regions.left, x, y, this.leftWidth, centerHeight * scaleY);
        this.sprites.center = this.createSprite(this.texture, regions.center, x + this.leftWidth, y, centerWidth * scaleX, centerHeight * scaleY);
        this.sprites.right = this.createSprite(this.texture, regions.right, x + this.targetWidth - this.rightWidth, y, this.rightWidth, centerHeight * scaleY);
        
        y += centerHeight * scaleY;
        this.sprites.bottomLeft = this.createSprite(this.texture, regions.bottomLeft, x, y, this.leftWidth, this.bottomHeight);
        this.sprites.bottom = this.createSprite(this.texture, regions.bottom, x + this.leftWidth, y, centerWidth * scaleX, this.bottomHeight);
        this.sprites.bottomRight = this.createSprite(this.texture, regions.bottomRight, x + this.targetWidth - this.rightWidth, y, this.rightWidth, this.bottomHeight);
    }
    
    createSprite(texture, region, x, y, width, height) {
        const sprite = new PIXI.Sprite(new PIXI.Texture(texture.baseTexture, region));
        sprite.x = x;
        sprite.y = y;
        sprite.width = width;
        sprite.height = height;
        this.addChild(sprite);
        return sprite;
    }
    
    setSize(width, height) {
        this.targetWidth = width;
        this.targetHeight = height;
        
        for (let key in this.sprites) {
            this.removeChild(this.sprites[key]);
        }
        this.sprites = {};
        
        this.init();
    }
}

