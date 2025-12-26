import * as PIXI from 'pixi.js';

class TetrisGameView extends PIXI.Container {
    
    constructor(game) {
        super();
        this.game = game;
        this.initBg();
        this.initBgCenter();
    }
    
    initBg() {
        const texture = this.game.textures['tetris/bg_total.png'];
        
        // 获取屏幕尺寸
        const screenWidth = this.game.pixi.screen.width;
        const screenHeight = this.game.pixi.screen.height;
        
        // 九宫格边距设置
        const leftWidth = 50;
        const topHeight = 50;
        const rightWidth = 50;
        const bottomHeight = 50;
        
        // 创建九宫格容器
        this.bg = new PIXI.Container();
        
        // 计算各区域的尺寸
        const textureWidth = texture.width;
        const textureHeight = texture.height;
        const centerWidth = textureWidth - leftWidth - rightWidth;
        const centerHeight = textureHeight - topHeight - bottomHeight;
        
        const targetWidth = screenWidth;
        const targetHeight = screenHeight;
        const scaleX = (targetWidth - leftWidth - rightWidth) / centerWidth;
        const scaleY = (targetHeight - topHeight - bottomHeight) / centerHeight;
        
        // 创建9个区域的纹理
        const regions = {
            // 四个角（不缩放）
            topLeft: new PIXI.Rectangle(0, 0, leftWidth, topHeight),
            topRight: new PIXI.Rectangle(textureWidth - rightWidth, 0, rightWidth, topHeight),
            bottomLeft: new PIXI.Rectangle(0, textureHeight - bottomHeight, leftWidth, bottomHeight),
            bottomRight: new PIXI.Rectangle(textureWidth - rightWidth, textureHeight - bottomHeight, rightWidth, bottomHeight),
            // 四个边（单方向缩放）
            top: new PIXI.Rectangle(leftWidth, 0, centerWidth, topHeight),
            bottom: new PIXI.Rectangle(leftWidth, textureHeight - bottomHeight, centerWidth, bottomHeight),
            left: new PIXI.Rectangle(0, topHeight, leftWidth, centerHeight),
            right: new PIXI.Rectangle(textureWidth - rightWidth, topHeight, rightWidth, centerHeight),
            // 中心（双向缩放）
            center: new PIXI.Rectangle(leftWidth, topHeight, centerWidth, centerHeight),
        };
        
        // 创建并添加9个精灵
        let x = -targetWidth / 2;
        let y = -targetHeight / 2;
        
        // 第一行
        this.addSprite(texture, regions.topLeft, x, y, leftWidth, topHeight);
        this.addSprite(texture, regions.top, x + leftWidth, y, centerWidth * scaleX, topHeight);
        this.addSprite(texture, regions.topRight, x + targetWidth - rightWidth, y, rightWidth, topHeight);
        
        // 第二行
        y += topHeight;
        this.addSprite(texture, regions.left, x, y, leftWidth, centerHeight * scaleY);
        this.addSprite(texture, regions.center, x + leftWidth, y, centerWidth * scaleX, centerHeight * scaleY);
        this.addSprite(texture, regions.right, x + targetWidth - rightWidth, y, rightWidth, centerHeight * scaleY);
        
        // 第三行
        y += centerHeight * scaleY;
        this.addSprite(texture, regions.bottomLeft, x, y, leftWidth, bottomHeight);
        this.addSprite(texture, regions.bottom, x + leftWidth, y, centerWidth * scaleX, bottomHeight);
        this.addSprite(texture, regions.bottomRight, x + targetWidth - rightWidth, y, rightWidth, bottomHeight);
        
        // 将背景容器添加到视图
        this.addChild(this.bg);
    }
    
    addSprite(texture, region, x, y, width, height) {
        const sprite = new PIXI.Sprite(new PIXI.Texture(texture.baseTexture, region));
        sprite.x = x;
        sprite.y = y;
        sprite.width = width;
        sprite.height = height;
        this.bg.addChild(sprite);
    }
}

export default TetrisGameView;