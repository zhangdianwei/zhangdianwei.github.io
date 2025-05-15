import * as PIXI from 'pixi.js';

export default class BgCircle extends PIXI.Container {
    constructor() {
        super();
        this.graphics = new PIXI.Graphics();
        this.addChild(this.graphics);
    }

    init(app) {
        this.radius = app.radius;
        this.lineWidth = 5;
        this.lineColor = 0xcccccc;
        this.graphics.clear();
        this.graphics.lineStyle(this.lineWidth, this.lineColor);
        // 不填充
        this.graphics.drawCircle(0, 0, this.radius);
        this.x = 0;
        this.y = 0;
    }
}

