import Bullet from './Bullet.js';
import * as PIXI from 'pixi.js';
import ShooterObjBase, { ShowLayer } from './ShooterObjBase.js';

export default class WeaponRifle extends ShooterObjBase {
    constructor(player) {
        super();
        this.shooting = false;
        this.player = player;
        this.fireInterval = 100; // 最小间隔（毫秒）
        this.cooldown = 0; // 毫秒
        // Debug: 可选调试内容
        // const debugBox = new PIXI.Graphics();
        // debugBox.beginFill(0xff0000);
        // debugBox.drawRect(-5, -5, 10, 10);
        // debugBox.endFill();
        // this.addChild(debugBox);
    }
    shoot() {
        if (this.cooldown > 0) return;
        const angle = this.player.angle;
        const x = this.player.x + Math.cos(angle) * 40;
        const y = this.player.y + Math.sin(angle) * 40;
        const bullet = new Bullet(x, y, angle);
        window.shooterApp.gameObjectManager.add(bullet);
        this.cooldown = this.fireInterval;
    }
    update(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
            if (this.cooldown < 0) this.cooldown = 0;
        }
        // 可扩展: 持续射击逻辑
    }
}
