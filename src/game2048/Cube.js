import * as PIXI from 'pixi.js';

export default class Cube extends PIXI.Container {
    constructor(value, initialX = 0, initialY = 0) {
        super();

        this.x = initialX;
        this.y = initialY;
        this.currentValue = value;
        this.speedRatio = 1; // 默认1，可用于合并动画加速
        // this.targetAngle = 0; // 目标角度
        // this.currentAngle = 0; // 当前角度，用于平滑旋转

        // 确保资源已加载
        const texture = PIXI.Texture.from('shooter/ship_E.png');
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
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff,
            align: 'center',
            stroke: 0x000000,
            strokeThickness: 3
        });
        this.valueText.anchor.set(0.5);
        this.valueText.y = 0; // 根据飞船图片调整文本位置，使其居中或合适位置
        this.addChild(this.valueText);

        // 初始化缩放：2的缩放为1，4为1.1，每翻倍加0.1
        this.updateScaleByValue(this.currentValue);

        // 初始化旋转，使其朝向右方 (如果图片默认朝右)
        // 如果图片默认朝上，则 this.shipSprite.rotation = -Math.PI / 2; this.rotation = 0;
        this.rotation = 0; // Container的旋转
    }

    updateScaleByValue(val) {
        // val: 2,4,8,16...
        // scale = 1 + 0.1 * (log2(val) - 1)
        let scale = 1;
        if (val >= 2) {
            scale = 1 + 0.1 * (Math.log2(val) - 1);
        }
        this.shipSprite.scale.set(scale);
        if (this.valueText) this.valueText.scale.set(scale);
    }

    setValue(newValue) {
        this.currentValue = newValue;
        this.valueText.text = newValue.toString();
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
