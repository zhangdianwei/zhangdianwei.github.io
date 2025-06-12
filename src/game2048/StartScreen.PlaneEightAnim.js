import * as PIXI from 'pixi.js';

/**
 * 画8字轨迹动画的飞机精灵
 * 用于StartScreen中间区域装饰
 */
export default class PlaneEightAnim extends PIXI.Container {
    constructor({
        centerX = 0,
        centerY = -10,
        radius = 48,
        duration = 6.4, // 单圈时长
        texture = PIXI.Texture.from('shooter/ship_E.png'),
    } = {}) {
        super();
        this.centerX = centerX;
        this.centerY = centerY;
        this.radius = radius;
        this.duration = duration;
        this.elapsed = 0;

        this.plane = new PIXI.Sprite(texture);
        this.plane.anchor.set(0.5);
        this.plane.width = 32;
        this.plane.height = 32;
        this.addChild(this.plane);

        this._updatePosition(0);
        this.ticker = PIXI.Ticker.shared;
        this.animStep = this._onTick.bind(this);
        this.ticker.add(this.animStep);
    }

    _onTick(delta) {
        this.elapsed += this.ticker.deltaMS / 1000;
        const t = (this.elapsed % this.duration) / this.duration;
        this._updatePosition(t);
    }

    _updatePosition(t) {
        // 8字轨迹参数方程
        // x = r * sin(2πt)
        // y = r * sin(2πt) * cos(2πt)
        const theta = 2 * Math.PI * t;
        const x = this.centerX + this.radius * Math.sin(theta);
        const y = this.centerY + this.radius * Math.sin(theta) * Math.cos(theta);
        this.plane.x = x;
        this.plane.y = y;
        // 飞机朝向运动切线方向
        const dx = this.radius * 2 * Math.PI * Math.cos(theta);
        const dy = this.radius * 2 * Math.PI * (Math.cos(2 * theta) - Math.sin(2 * theta)) / 2;
        this.plane.rotation = Math.atan2(dy, dx);
    }

    destroy(options) {
        if (this.ticker && this.animStep) {
            this.ticker.remove(this.animStep);
        }
        super.destroy(options);
    }
}
