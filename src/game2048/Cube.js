import * as PIXI from 'pixi.js';

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
        
        // 确保资源已加载
        const texture = PIXI.Texture.from('game2048/ship_E.png');
        if (!texture) {
            console.error('Ship_E texture not found. Make sure it is loaded.');
            // 可以添加一个占位符图形
            this.shipSprite = new PIXI.Graphics().beginFill(0xff0000).drawRect(-15, -15, 30, 30).endFill();
        } else {
            this.shipSprite = new PIXI.Sprite(texture);
        }
        
        this.shipSprite.anchor.set(0.5);
        this.addChild(this.shipSprite);

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
        this.shipSprite.tint = Cube.getLightColorByValue(this.currentValue);
        this.valueText.anchor.set(0.5);
        this.valueText.y = 0; // 根据飞船图片调整文本位置，使其居中或合适位置
        this.addChild(this.valueText);

        // 初始化缩放：2的缩放为1，4为1.1，每翻倍加0.1
        this.updateScaleByValue(this.currentValue);

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
        // val: 2,4,8,16...
        // scale = 1 + 0.1 * (log2(val) - 1)
        let scale = 1;
        if (val >= 2) {
            scale = 1 + 0.1 * (Math.log2(val) - 1);
        }
        this.shipSprite.scale.set(scale);
        // 数字不缩放，保持默认scale=1
        if (this.valueText) this.valueText.scale.set(1);
    }

    setValue(newValue) {
        this.currentValue = newValue;
        this.valueText.text = newValue.toString();
        const color = Cube.getColorByValue(newValue);
        this.valueText.style.fill = color;
        this.valueText.style.fontWeight = 'bold';
        this.valueText.style.fontSize = 32;
        this.valueText.style.stroke = 0x222222;
        this.valueText.style.strokeThickness = 6;
        this.valueText.style.dropShadow = true;
        this.valueText.style.dropShadowColor = 0x000000;
        this.valueText.style.dropShadowBlur = 4;
        this.valueText.style.dropShadowDistance = 0;
        this.shipSprite.tint = Cube.getLightColorByValue(newValue);
        this.updateScaleByValue(newValue);
    }

    get value() {
        return this.currentValue;
    }

    getSize() {
        // shipSprite.width是原始宽度，考虑scale
        return this.shipSprite.width * this.shipSprite.scale.x;
    }
}
