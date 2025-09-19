import { TankApp } from './TankApp.js';

export default class InputManager {
    constructor() {
        this.tankApp = TankApp.instance;
        this.keys = {};
        this.lastShootTime = 0;
        this.shootCooldown = 0.3;
        this.logic = null; // 由 TankLogic 绑定
        this._onKeyDown = null;
        this._onKeyUp = null;
    }

    setupInput() {
        if (!this._onKeyDown) {
            this._onKeyDown = (e) => {
                this.keys[e.code] = true;
                switch (e.code) {
                    case 'Space':
                        e.preventDefault();
                        this.shoot();
                        break;
                    case 'KeyP':
                        e.preventDefault();
                        if (this.logic && typeof this.logic.togglePause === 'function') {
                            this.logic.togglePause();
                        }
                        break;
                }
            };
        }
        if (!this._onKeyUp) {
            this._onKeyUp = (e) => {
                this.keys[e.code] = false;
            };
        }
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    // 由 TankLogic 在 init 时绑定逻辑对象
    bindLogic(logic) {
        this.logic = logic;
    }

    updatePlayerInput() {
        const player = this.tankApp.player;
        if (!player) return;
        
        let direction = -1;
        
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            direction = 0;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            direction = 1;
        } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            direction = 2;
        } else if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            direction = 3;
        }
        
        if (direction >= 0) {
            player.setDirection(direction);
            player.setMoving(true);
        } else {
            player.setMoving(false);
        }
    }

    shoot() {
        const player = this.tankApp.player;
        if (!player) return;
        
        const now = Date.now() / 1000;
        if (now - this.lastShootTime < this.shootCooldown) return;
        
        this.lastShootTime = now;
        if (this.logic && typeof this.logic.createPlayerBullet === 'function') {
            this.logic.createPlayerBullet(player.direction);
        }
    }

    destroy() {
        if (this._onKeyDown) {
            window.removeEventListener('keydown', this._onKeyDown);
            this._onKeyDown = null;
        }
        if (this._onKeyUp) {
            window.removeEventListener('keyup', this._onKeyUp);
            this._onKeyUp = null;
        }
    }
}