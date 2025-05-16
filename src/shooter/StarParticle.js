import * as PIXI from 'pixi.js';
import ShooterObjBase, { ShowLayer } from './ShooterObjBase.js';

// 单个星星粒子组件
export default class StarParticle extends PIXI.Graphics {
    constructor(x, y, options = {}) {
        super();
        this.x = x;
        this.y = y;
        this.alpha = 1;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.fade = options.fade || 0.03;
        this.color = options.color || (0xffff66 + Math.floor(Math.random()*0x30));
        this.spikes = options.spikes || 5;
        this.outerRadius = options.outerRadius || (2 + Math.random()*2);
        this.innerRadius = options.innerRadius || (1 + Math.random()*1);
        this.drawStar();

    }

    drawStar() {
        this.clear();
        this.beginFill(this.color);
        let rot = Math.PI / 2 * 3;
        let x = 0;
        let y = 0;
        let step = Math.PI / this.spikes;
        this.moveTo(0, -this.outerRadius);
        for (let i = 0; i < this.spikes; i++) {
            x = Math.cos(rot) * this.outerRadius;
            y = Math.sin(rot) * this.outerRadius;
            this.lineTo(x, y);
            rot += step;
            x = Math.cos(rot) * this.innerRadius;
            y = Math.sin(rot) * this.innerRadius;
            this.lineTo(x, y);
            rot += step;
        }
        this.lineTo(0, -this.outerRadius);
        this.endFill();
    }


}
