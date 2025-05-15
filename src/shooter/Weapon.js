import Bullet from './Bullet.js';
import * as PIXI from 'pixi.js';

export default class Weapon extends PIXI.Container {
    constructor(player) {
        super();
        this.player = player;
        this.cooldown = 0; // 帧
        this.fireInterval = 5; // 最小间隔（帧）
        // Debug: 添加一个小红色方块
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
        if (this.parent) this.parent.addChild(bullet);
        const app = window.shooterApp;
        if (app && app.gameObjectManager) app.gameObjectManager.add(bullet);
        this.cooldown = this.fireInterval;
    }
    update() {
        if (this.cooldown > 0) this.cooldown--;
        // 子弹的update由全局统一管理
    }
}
