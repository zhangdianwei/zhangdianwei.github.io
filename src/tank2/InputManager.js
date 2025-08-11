import { TankApp } from './TankApp.js';

export default class InputManager {
    constructor() {
        this.tankApp = TankApp.instance;
        this.keys = {};
        this.lastShootTime = 0;
        this.shootCooldown = 0.3;
    }

    setupInput() {
        // window.addEventListener('keydown', (e) => {
        //     this.keys[e.code] = true;
            
        //     switch (e.code) {
        //         case 'Space':
        //             e.preventDefault();
        //             this.shoot();
        //             break;
        //         case 'KeyP':
        //             e.preventDefault();
        //             this.togglePause();
        //             break;
        //         case 'KeyR':
        //             e.preventDefault();
        //             this.restart();
        //             break;
        //     }
        // });
        
        // window.addEventListener('keyup', (e) => {
        //     this.keys[e.code] = false;
        // });
    }

    updatePlayerInput() {
        const player = this.tankApp.player;
        if (!player) return;
        
        let direction = -1;
        
        if (this.keys['ArrowUp']) {
            direction = 0;
        } else if (this.keys['ArrowRight']) {
            direction = 1;
        } else if (this.keys['ArrowDown']) {
            direction = 2;
        } else if (this.keys['ArrowLeft']) {
            direction = 3;
        }
        
        if (direction >= 0) {
            const speed = player.speed;
            const radians = (direction * 90) * Math.PI / 180;
            const dx = Math.sin(radians) * speed;
            const dy = -Math.cos(radians) * speed;
            
            const newX = player.x + dx;
            const newY = player.y + dy;
            
            if (this.tankApp.levelData.isWalkable(newX, newY)) {
                player.move(direction);
            } else {
                player.setDirection(direction);
            }
        } else {
            player.stop();
        }
    }

    shoot() {
        const player = this.tankApp.player;
        if (!player) return;
        
        const now = Date.now() / 1000;
        if (now - this.lastShootTime < this.shootCooldown) return;
        
        this.lastShootTime = now;
        
        this.createPlayerBullet(player.direction);
    }

    destroy() {
        window.removeEventListener('keydown', this.setupInput);
        window.removeEventListener('keyup', this.setupInput);
    }
} 