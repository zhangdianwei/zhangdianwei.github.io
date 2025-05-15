import Bullet from './Bullet.js';
import * as PIXI from 'pixi.js';

export default class Weapon extends PIXI.Container {
    constructor(player, app) {
        super();
        this.player = player;
        this.app = app;
        this.cooldown = 0; // 帧
        this.fireInterval = 10; // 最小间隔（帧）
    }
    shoot() {
        if (this.cooldown > 0) return;
        const angle = this.player.angle;
        const x = this.player.x + Math.cos(angle) * 40;
        const y = this.player.y + Math.sin(angle) * 40;
        const bullet = new Bullet(x, y, angle);
        if (this.parent) this.parent.addChild(bullet);
        if (this.app && this.app.gameObjectManager) this.app.gameObjectManager.add(bullet);
        this.cooldown = this.fireInterval;
    }
    update() {
        if (this.cooldown > 0) this.cooldown--;
        // 子弹的update由全局统一管理
    }
}
