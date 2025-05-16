import * as PIXI from 'pixi.js';
import ShooterObjBase from './ShooterObjBase.js';

export default class BgCircle extends ShooterObjBase {
    constructor() {
        super();
        this.graphics = new PIXI.Graphics();
        this.addChild(this.graphics);
        this.stars = [];
    }

    init() {
        this.radius = window.shooterApp.radius;
        this.lineWidth = 5;
        this.lineColor = 0xcccccc;
        this.graphics.clear();
        this.graphics.lineStyle(this.lineWidth, this.lineColor);
        // 不填充
        this.graphics.drawCircle(0, 0, this.radius);
        this.x = 0;
        this.y = 0;

        this._createStars();
    }

    _createStars() {
        // 清除旧星星
        for (const star of this.stars) {
            this.removeChild(star);
        }
        this.stars = [];

        const app = window.shooterApp;
        if (!app || !app.pixi || !app.pixi.screen) return;
        const width = app.pixi.screen.width;
        const height = app.pixi.screen.height;
        const starCount = 80;
        for (let i = 0; i < starCount; i++) {
            this._createStar(width, height);
        }
    }

    // 创建单个星星，加入 this.stars
    _createStar(width, height) {
        const x = Math.random() * width - width/2;
        const y = Math.random() * height - height/2;
        const scale = Math.random() * 0.4 + 0.2;
        const baseAlpha = Math.random() * 0.25 + 0.05; // 0.05~0.3，整体更暗
        const star = PIXI.Sprite.from('shooter/star_small.png');
        star.x = x;
        star.y = y;
        star.anchor.set(0.5);
        star.scale.set(scale);
        star.alpha = baseAlpha;
        star._baseAlpha = baseAlpha;
        // 闪烁次数
        star._maxTwinkle = Math.floor(Math.random() * 7) + 4; // 4~10次
        star._twinkleCount = 0;
        // 极简异步闪烁：独立计时器和速度
        star._twinkleTime = Math.random() * Math.PI * 2; // 初始相位
        star._twinkleSpeed = Math.random() * 0.001 + 0.0001;
        star._lastSin = Math.sin(star._twinkleTime);
        star.alpha = star._baseAlpha;
        this.addChildAt(star, 0);
        this.stars.push(star);
    }

    update(delta) {
        // this._updateStars(delta);
        this._updateShake(delta);
    }

    // strength: 抖动幅度（如0.05表示最大scale±5%），duration: 毫秒
    shake(strength = 0.01, duration = 50) {
        this._shakeStrength = strength;
        this._shakeDuration = duration;
        this._shakeTime = 0;
        this._shakeActive = true;
    }

    _updateShake(delta = 16) {
        if (!this._shakeActive) {
            if (this.graphics && (this.graphics.scale.x !== 1 || this.graphics.scale.y !== 1)) {
                this.graphics.scale.set(1, 1);
            }
            return;
        }
        this._shakeTime += delta;
        const progress = this._shakeTime / this._shakeDuration;
        if (progress >= 1) {
            if (this.graphics) this.graphics.scale.set(1, 1);
            this._shakeActive = false;
            return;
        }
        // 抖动实现：sin震荡+随机扰动（scale）
        const angle = Math.random() * Math.PI * 2;
        const strength = this._shakeStrength * (1 - progress) * (0.7 + 0.3 * Math.sin(progress * Math.PI * 8));
        const sx = 1 + Math.cos(angle) * strength;
        const sy = 1 + Math.sin(angle) * strength;
        if (this.graphics) this.graphics.scale.set(sx, sy);
    }

    _updateStars(delta) {
        // delta 单位大致为 ms
        const app = window.shooterApp;
        if (!app || !app.pixi || !app.pixi.screen) return;
        const width = app.pixi.screen.width;
        const height = app.pixi.screen.height;
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star._twinkleTime += star._twinkleSpeed * delta;
            const sinVal = Math.sin(star._twinkleTime);
            star.alpha = star._baseAlpha * Math.abs(sinVal);
            // 检测sin波从负变正，计一次闪烁
            if (star._lastSin < 0 && sinVal >= 0) {
                star._twinkleCount++;
                if (star._twinkleCount >= star._maxTwinkle) {
                    this.removeChild(star);
                    this.stars.splice(i, 1);
                    this._createStar(width, height);
                    continue;
                }
            }
            star._lastSin = sinVal;
        }
    }
}

