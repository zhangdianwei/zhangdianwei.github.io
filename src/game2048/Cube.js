import * as PIXI from 'pixi.js';
import * as intersects from 'intersects';

export default class Cube extends PIXI.Container {
    // 颜色列表，低级到高级
    static COLOR_LIST = [
        0xcccccc, // 2
        0x99ccff, // 4
        0x66cc99, // 8
        0xffcc66, // 16
        0xff9966, // 32
        0xff6666, // 64
        0xcc66ff, // 128
        0x6699ff, // 256
        0x33cccc, // 512
        0x66ff99, // 1024
        0xffff66, // 2048
        0xffffff  // 超级
    ];

    static getColorByValue(val) {
        // 假设val为2的幂
        const idx = Math.max(0, Math.min(Cube.COLOR_LIST.length - 1, Math.log2(val) - 1));
        return Cube.COLOR_LIST[idx];
    }

    // 生成更浅的颜色（混合白色）
    static getLightColorByValue(val, ratio = 0.5) {
        const base = Cube.getColorByValue(val);
        // 拆分rgb
        const r = (base >> 16) & 0xff;
        const g = (base >> 8) & 0xff;
        const b = base & 0xff;
        // 混合白色
        const lr = Math.round(r + (255 - r) * ratio);
        const lg = Math.round(g + (255 - g) * ratio);
        const lb = Math.round(b + (255 - b) * ratio);
        return (lr << 16) | (lg << 8) | lb;
    }

    constructor(value, initialX = 0, initialY = 0) {
        super();

        this.currentValue = value;
        this.speedRatio = 1; // 默认1，可用于合并动画加速
        this.snake = null; // 归属snake对象

        this.x = initialX;
        this.y = initialY;
        
        // Debug功能
        this.debugMode = false;
        this.debugGraphics = null;
        
        // Anchor配置
        this.selfAnchorX = 1;
        
        // 确保资源已加载
        const texture = PIXI.Texture.from('game2048/ship_E.png');
        if (!texture) {
            console.error('Ship_E texture not found. Make sure it is loaded.');
            // 可以添加一个占位符图形
            this.shipSprite = new PIXI.Graphics().beginFill(0xff0000).drawRect(-15, -15, 30, 30).endFill();
        } else {
            this.shipSprite = new PIXI.Sprite(texture);
        }
        
        this.shipSprite.anchor.set(this.selfAnchorX, 0.5);
        this.addChild(this.shipSprite);
        this.shipSprite.tint = Cube.getLightColorByValue(this.currentValue);

        this.valueText = new PIXI.Text(this.currentValue.toString(), {
            fontFamily: 'Arial Black, Arial, Montserrat, Impact, sans-serif',
            fontSize: 28, // 更大
            fontWeight: 'bold',
            fill: Cube.getColorByValue(this.currentValue),
            align: 'center',
            stroke: 0x222222, // 更深的描边
            strokeThickness: 6, // 更粗
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 4,
            dropShadowDistance: 0
        });
        // 设置图片颜色（更浅）
        this.valueText.anchor.set(0.5);
        this.shipSprite.addChild(this.valueText);

        // 初始化缩放：2的缩放为1，4为1.1，每翻倍加0.1
        this.updateScaleByValue(this.currentValue);
        this.setValue(this.currentValue);

        // 初始化旋转，使其朝向右方 (如果图片默认朝右)
        // 如果图片默认朝上，则 this.shipSprite.rotation = -Math.PI / 2; this.rotation = 0;
        this.rotation = 0; // Container的旋转

        this.setSnake(null);
    }

    setSnake(snake){
        this.snake = snake;
        if (snake) {
            this.shipSprite.tint = Cube.getLightColorByValue(this.currentValue);
            this.valueText.style.fill = Cube.getColorByValue(this.currentValue);
        }
        else{
            this.shipSprite.tint = 0xcccccc;
            this.valueText.style.fill = 0xcccccc;
        }
    }

    updateScaleByValue(val) {
        let scale = 1;
        if (val >= 2) {
            scale = 1 + 0.1 * (Math.log2(val) - 1);
        }
        this.shipSprite.scale.set(scale);
        // this.scale.set(scale);
    }

    setValue(newValue) {
        this.currentValue = newValue;
        this.valueText.text = newValue.toString();
        const color = Cube.getColorByValue(newValue);
        this.valueText.style.fill = color;
        this.updateScaleByValue(newValue);
        this.valueText.x = -25;
        // this.updateDebugGraphics();
    }

    getRealCenter(){
        const x = (0.5 - this.selfAnchorX) * this.shipSprite.width;
        const y = 0;
        return {x, y}
    }

    get value() {
        return this.currentValue;
    }

    getSize() {
        return this.shipSprite.width;
    }

    getCollision() {
        const size = this.getSize();

        const {x, y} = this.getRealCenter();
        const globalPos = this.toGlobal(new PIXI.Point(x, y));
        
        return {
            centerX: globalPos.x,
            centerY: globalPos.y,
            radius: size / 2
        };
    }

    updateDebugGraphics() {
        if (!this.debugGraphics) {
            this.debugGraphics = new PIXI.Graphics();
            this.addChild(this.debugGraphics);
        }
        
        this.debugGraphics.clear();
        
        const collision = this.getCollision();
        
        const localPos = this.toLocal(new PIXI.Point(collision.centerX, collision.centerY));
        
        const radius = collision.radius / this.shipSprite.scale.x;
        this.debugGraphics.lineStyle(2, 0xff0000);
        this.debugGraphics.drawCircle(localPos.x, localPos.y, radius);
        
        this.debugGraphics.beginFill(0x00ff00);
        this.debugGraphics.drawCircle(localPos.x, localPos.y, 5);
        this.debugGraphics.endFill();
        
        this.debugGraphics.beginFill(0x000000);
        this.debugGraphics.drawCircle(0, 0, 5);
        this.debugGraphics.endFill();
    }

    clearDebugGraphics() {
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        }
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        if (this.debugMode) {
            this.updateDebugGraphics();
        } else {
            this.clearDebugGraphics();
        }
    }
}
