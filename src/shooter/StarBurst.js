
import StarParticle from './StarParticle.js';

// 星光爆发组件：一次性生成一组星星粒子
import ShooterObjBase, { ShowLayer } from './ShooterObjBase.js';

export default class StarBurst extends ShooterObjBase {
    /**
     * @param {number} x - 爆发中心x
     * @param {number} y - 爆发中心y
     * @param {Object} options - 配置项
     *        options.numParticles 粒子数量
     *        options.fade 粒子消失速度
     *        options.color 粒子颜色
     *        options.spikes 星角数
     *        options.outerRadius 外半径
     *        options.innerRadius 内半径
     *        options.speedMin, speedMax 速度区间
     */
    constructor(x, y, options = {}) {
        super();
        this.x = x;
        this.y = y;
        this.ShowLayer = ShowLayer.EFFECT;
        const numParticles = options.numParticles || 2;
        const fade = options.fade || 0.05;
        // 统一亮黄色
        const color = options.color || 0xffff99;
        const spikes = options.spikes || 5;
        // 放大星星尺寸
        const outerRadius = options.outerRadius || (4 + Math.random()*3);
        const innerRadius = options.innerRadius || (2 + Math.random()*2);
        // 增加速度
        const speedMin = options.speedMin || 3.5;
        const speedMax = options.speedMax || 7;
        this.particles = [];
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = speedMin + Math.random() * (speedMax - speedMin);
            const particle = new StarParticle(
                0, 0, // 相对本容器中心
                {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    fade,
                    color,
                    spikes,
                    outerRadius,
                    innerRadius
                }
            );
            this.addChild(particle);
            this.particles.push(particle);
        }
        // 注册整个爆发的tick
        this._onTick = this._onTick.bind(this);
        if (window.shooterApp && window.shooterApp.tickManager) {
            window.shooterApp.tickManager.register(this._onTick, this);
        }
    }

    _onTick(delta) {
        delta /= 10;
        // 统一更新所有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.alpha -= (p.fade || 0.03) * delta;
            if (p.alpha <= 0) {
                if (p.parent) p.parent.removeChild(p);
                this.particles.splice(i, 1);
            }
        }
        // 所有粒子消失后自销毁
        if (this.particles.length === 0) {
            window.shooterApp.gameObjectManager.remove(this)
        }
    }

}