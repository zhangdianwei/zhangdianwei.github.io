import * as PIXI from 'pixi.js';
import {GameApp} from './GameApp.js'; // 用于获取资源加载器等

export default class Cube extends PIXI.Container {
    constructor(value, initialX = 0, initialY = 0) {
        super();

        this.x = initialX;
        this.y = initialY;
        this.currentValue = value;
        this.speed = 3; // 基础移动速度，可以被Snake或Player覆盖/调整
        this.targetAngle = 0; // 目标角度
        this.currentAngle = 0; // 当前角度，用于平滑旋转

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

    // 简单的更新逻辑，朝向目标点移动和旋转
    // targetX, targetY 是Cube应该追逐的目标点的坐标 (在父容器坐标系中)
    // deltaTime 是帧间时间差
    updateMovement(targetX, targetY, deltaTime) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        // 更新旋转 (朝向目标)
        if (distanceToTarget > 0.1) { // 避免在目标点时抖动
            this.targetAngle = Math.atan2(dy, dx);
        }
        // 平滑旋转 (Lerp)
        // this.rotation = lerpAngle(this.rotation, this.targetAngle, 0.1 * deltaTime);
        // 暂时直接设置旋转，如果需要平滑，后续可以添加lerpAngle函数
        this.rotation = this.targetAngle;


        // 移动 (朝向目标)
        if (distanceToTarget > 1) { // 移动阈值，避免微小抖动
            const moveX = (dx / distanceToTarget) * this.speed * deltaTime;
            const moveY = (dy / distanceToTarget) * this.speed * deltaTime;
            this.x += moveX;
            this.y += moveY;
        } else if (distanceToTarget > 0) {
            this.x = targetX;
            this.y = targetY;
        }
    }

    // 辅助函数：角度线性插值 (处理角度环绕问题)
    // static lerpAngle(startAngle, endAngle, t) {
    //     let delta = (endAngle - startAngle) % (2 * Math.PI);
    //     if (delta > Math.PI) delta -= 2 * Math.PI;
    //     if (delta < -Math.PI) delta += 2 * Math.PI;
    //     return startAngle + delta * t;
    // }

    get value() {
        return this.currentValue;
    }

    // 如果需要，可以添加一个 getRadius() 或 getSize() 方法来帮助进行碰撞检测或间距保持
    // getBoundingRadius() {
    //     return Math.max(this.shipSprite.width, this.shipSprite.height) / 2;
    // }
}

// 确保在 Game2048.vue 或 GameApp.js 中加载资源 'ship_E'
// PIXI.Assets.add('ship_E', 'path/to/your/ship_E.png');
// await PIXI.Assets.load('ship_E');
