import * as PIXI from 'pixi.js';
import { GameApp } from './GameApp.js';

export default class BgCircle extends PIXI.Container {
    constructor() {
        super();
        this.graphics = new PIXI.Graphics();
        this.addChild(this.graphics);
        this.stars = [];
    }

    init() {
        const gameApp = GameApp.instance;
        this.radius = gameApp.radius;
        this.lineWidth = 5;
        this.lineColor = 0xcccccc;
        this.graphics.clear();
        this.graphics.lineStyle(this.lineWidth, this.lineColor);
        this.graphics.drawCircle(0, 0, this.radius);
        this.x = 0;
        this.y = 0;

        this._createStars();
    }

    _createStars() {
        for (const star of this.stars) {
            this.removeChild(star);
        }
        this.stars = [];

        const gameApp = GameApp.instance;

        const width = gameApp.pixi.screen.width;
        const height = gameApp.pixi.screen.height;
        const starCount = 80;
        for (let i = 0; i < starCount; i++) {
            this._createStar(width, height);
        }
    }

    // 创建单个星星，加入 this.stars
    _createStar(width, height) {
        const x = Math.random() * this.radius - this.radius/2;
        const y = Math.random() * this.radius - this.radius/2;
        const scale = Math.random() * 0.4 + 0.4;
        const baseAlpha = Math.random() * 0.25 + 0.05; // 0.05~0.3，整体更暗
        const star = PIXI.Sprite.from('game2048/star_small.png'); 
        star.x = x;
        star.y = y;
        star.anchor.set(0.5);
        star.scale.set(scale);
        star.alpha = baseAlpha;
        star._baseAlpha = baseAlpha;
        star._maxTwinkle = Math.floor(Math.random() * 7) + 4; // 4~10次
        star._twinkleCount = 0;
        star._twinkleTime = Math.random() * Math.PI * 2;
        star._twinkleSpeed = Math.random() * 0.001 + 0.0001;
        star._lastSin = Math.sin(star._twinkleTime);
        star.alpha = star._baseAlpha;
        this.addChildAt(star, 0);
        this.stars.push(star);
    }

    // update(delta) {
    //     this._updateStars(delta);
    // }

    _updateStars(delta) {
        const gameApp = GameApp.instance;
        const width = gameApp.pixi.screen.width;
        const height = gameApp.pixi.screen.height;
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star._twinkleTime += star._twinkleSpeed * delta;
            const sinVal = Math.sin(star._twinkleTime);
            star.alpha = star._baseAlpha * Math.abs(sinVal);
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


