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
            const x = Math.random() * width - width/2;
            const y = Math.random() * height - height/2;
            const scale = Math.random() * 0.4 + 0.2;
            const baseAlpha = Math.random() * 0.5 + 0.5;
            const phase = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.1 + 0.08; // 0.08~0.18，星星闪烁更慢
            const star = PIXI.Sprite.from('shooter/star_small.png');
            star.x = x;
            star.y = y;
            star.anchor.set(0.5);
            star.scale.set(scale);
            star.alpha = baseAlpha;
            star._baseAlpha = baseAlpha;
            star._phase = phase;
            star._speed = speed;
            this.addChildAt(star, 0);
            this.stars.push(star);
        }
    }

    update(delta) {
        this._updateStars(delta);
    }

    _updateStars(delta) {
        let now = Date.now();
        for (const star of this.stars) {
            let t = now/1000 + star._phase;
            star.alpha = star._baseAlpha * (0.7 + 0.3 * Math.sin(t));
        }
    }
}

