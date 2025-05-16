import Bullet from './Bullet.js';
import * as PIXI from 'pixi.js';

export default class RifleWeapon extends PIXI.Container {
    constructor(player) {
        super();
        this.player = player;
        this.fireInterval = 100; // 最小间隔（毫秒）
        this.cooldown = 0; // 秒
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
    update(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
            if (this.cooldown < 0) this.cooldown = 0;
        }
    }
}
