import Enermy from './Enermy.js';

export default class EnermyManager {
    constructor(player, gameObjectManager, options = {}) {
        this.player = player;
        this.gameObjectManager = gameObjectManager;
        this.spawnInterval = options.spawnInterval || 2000; // ms
        this.batchSize = options.batchSize || 1;
        this.radius = options.spawnRadius || (window.shooterApp.radius + 60); // 圆环外
        this.enermies = [];
        this._lastSpawn = 0;
        this._tick = this._tick.bind(this);
        window.shooterApp.tickManager.register(this._tick, this);
    }

    _tick(delta) {
        this._lastSpawn += delta * 16.67; // delta为帧数比例，近似换算ms
        if (this._lastSpawn >= this.spawnInterval) {
            this._lastSpawn = 0;
            this.spawnBatch();
        }
        // 更新所有存活敌人AI
        for (const e of this.enermies) {
            if (e && e.updateAI) e.updateAI(this.player);
        }
        // 清理已被移除的敌人
        this.enermies = this.enermies.filter(e => e.parent);
    }

    async spawnBatch() {
        for (let i = 0; i < this.batchSize; i++) {
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * this.radius;
            const y = Math.sin(angle) * this.radius;
            const enermy = new Enermy();
            await enermy.init();
            enermy.x = x;
            enermy.y = y;
            enermy.angle = angle + Math.PI; // 朝向圆心
            // 追逐AI: 每帧朝向玩家移动
            enermy.updateAI = function(player) {
                if (!player) return;
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const targetAngle = Math.atan2(dy, dx);
                this.angle = targetAngle;
                if (this.sprite) this.sprite.rotation = this.angle;
                const speed = this.speed || 2;
                this.x += Math.cos(this.angle) * speed;
                this.y += Math.sin(this.angle) * speed;
            };
            this.gameObjectManager.add(enermy);
            this.enermies.push(enermy);
        }
    }

    destroy() {
        window.shooterApp.tickManager.unregisterByObj(this);
        this.enermies.forEach(e => { if (e.parent) e.parent.removeChild(e); });
        this.enermies = [];
    }
}
