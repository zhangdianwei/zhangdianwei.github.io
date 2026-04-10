import { TankApp } from './TankApp.js';
import { MapWidth, MapHeight } from './TileType.js';

export default class TankGameLogic {
    constructor(gameUI) {
        this.gameUI = gameUI;
        this.tankApp = TankApp.instance;
    }

    update(deltaTime) {
        if (this.tankApp.playerData.levelEndType !== 0) return;

        this.gameUI.updater.forEach((updater) => {
            updater.update(deltaTime);
        });

        if (this.gameUI.player) {
            this.gameUI.player.update(deltaTime);
        }

        this.gameUI.enemies.forEach((enemy) => {
            enemy.update(deltaTime);
        });

        this.gameUI.playerBullets.forEach((bullet) => {
            bullet.update(deltaTime);
        });

        this.gameUI.enemyBullets.forEach((bullet) => {
            bullet.update(deltaTime);
        });

        this.checkCollisions();
    }

    checkCollisions() {
        const playerBullets = this.gameUI.playerBullets.concat();
        const enemyBullets = this.gameUI.enemyBullets.concat();
        const allBullets = [...playerBullets, ...enemyBullets];
        const player = this.gameUI.player;
        const enemies = this.gameUI.enemies;

        for (let i = 0; i < allBullets.length; i++) {
            this.gameUI.map.checkCollisionBullet(allBullets[i]);
        }

        if (this.gameUI.home && !this.gameUI.home.isDead) {
            for (let i = 0; i < allBullets.length; i++) {
                const bullet = allBullets[i];
                if (this.gameUI.home.checkCollision(bullet.x, bullet.y)) {
                    this.gameUI.home.takeDamage(bullet.power);
                    bullet.makeDead();
                }
            }
        }

        playerBullets.forEach((bullet) => {
            enemies.forEach((enemy) => {
                if (this.checkBulletTankCollision(bullet, enemy)) {
                    enemy.takeDamage(bullet.power);
                    bullet.makeDead();
                }
            });
        });

        enemyBullets.forEach((bullet) => {
            if (player && this.checkBulletTankCollision(bullet, player)) {
                player.takeDamage(bullet.power);
                bullet.makeDead();
            }
        });

        playerBullets.forEach((playerBullet) => {
            enemyBullets.forEach((enemyBullet) => {
                if (this.checkBulletBulletCollision(playerBullet, enemyBullet)) {
                    playerBullet.makeDead();
                    enemyBullet.makeDead();
                }
            });
        });
    }

    checkBulletTankCollision(bullet, tank) {
        if (!bullet || !tank || bullet.isDead || tank.isDead) return false;

        const bulletBounds = bullet.getBounds();
        const tankBounds = tank.getBounds();
        return bulletBounds.x < tankBounds.x + tankBounds.width &&
               bulletBounds.x + bulletBounds.width > tankBounds.x &&
               bulletBounds.y < tankBounds.y + tankBounds.height &&
               bulletBounds.y + bulletBounds.height > tankBounds.y;
    }

    checkBulletBulletCollision(bullet1, bullet2) {
        if (!bullet1 || !bullet2 || bullet1.isDead || bullet2.isDead) return false;

        const bullet1Bounds = bullet1.getBounds();
        const bullet2Bounds = bullet2.getBounds();
        return bullet1Bounds.x < bullet2Bounds.x + bullet2Bounds.width &&
               bullet1Bounds.x + bullet1Bounds.width > bullet2Bounds.x &&
               bullet1Bounds.y < bullet2Bounds.y + bullet2Bounds.height &&
               bullet1Bounds.y + bullet1Bounds.height > bullet2Bounds.y;
    }

    checkTankTankCollision(tank1, tank2) {
        if (!tank1 || !tank2 || tank1 === tank2) return false;

        const tank1Bounds = tank1.getBounds();
        const tank2Bounds = tank2.getBounds();
        return tank1Bounds.x < tank2Bounds.x + tank2Bounds.width &&
               tank1Bounds.x + tank1Bounds.width > tank2Bounds.x &&
               tank1Bounds.y < tank2Bounds.y + tank2Bounds.height &&
               tank1Bounds.y + tank1Bounds.height > tank2Bounds.y;
    }

    // 只判断坦克
    getMovableDistance(bounds, direction, excludeTank = null) {
        const centerX = bounds.x;
        const centerY = bounds.y;
        const width = bounds.width;
        const height = bounds.height;
        const allTanks = [this.gameUI.player, ...this.gameUI.enemies].filter((t) => t && t !== excludeTank);

        let minDistance = Infinity;
        for (const tank of allTanks) {
            const tankBounds = tank.getBounds();
            const tankCenterX = tankBounds.x;
            const tankCenterY = tankBounds.y;
            const tankWidth = tankBounds.width;
            const tankHeight = tankBounds.height;
            let distance = Infinity;

            if (direction === 0) {
                if (centerX - width / 2 < tankCenterX + tankWidth / 2 &&
                    centerX + width / 2 > tankCenterX - tankWidth / 2) {
                    distance = centerY - height / 2 - (tankCenterY + tankHeight / 2);
                }
            } else if (direction === 1) {
                if (centerY - height / 2 < tankCenterY + tankHeight / 2 &&
                    centerY + height / 2 > tankCenterY - tankHeight / 2) {
                    distance = tankCenterX - tankWidth / 2 - (centerX + width / 2);
                }
            } else if (direction === 2) {
                if (centerX - width / 2 < tankCenterX + tankWidth / 2 &&
                    centerX + width / 2 > tankCenterX - tankWidth / 2) {
                    distance = tankCenterY - tankHeight / 2 - (centerY + height / 2);
                }
            } else if (direction === 3) {
                if (centerY - height / 2 < tankCenterY + tankHeight / 2 &&
                    centerY + height / 2 > tankCenterY - tankHeight / 2) {
                    distance = centerX - width / 2 - (tankCenterX + tankWidth / 2);
                }
            }

            if (distance < minDistance) {
                minDistance = distance;
            }
        }

        if (minDistance === Infinity || minDistance < 0) {
            return 1000;
        }
        return minDistance;
    }

    isInBounds(x, y) {
        return x >= 0 && x < MapWidth && y >= 0 && y < MapHeight;
    }

    onTankDeadFinish(tank) {
        if (tank === this.gameUI.player) {
            this.gameUI.removePlayer(tank);
            this.checkCreatePlayer();
        } else {
            this.gameUI.removeEnemy(tank);
            this.tankApp.playerData.addEnemyDestroyed(tank.tankType, 1);
        }
        this.gameUI.side.updateView();
        this.checkGameState();
    }

    onHomeDeadFinish() {
        this.gameUI.home = null;
        this.checkGameState();
    }

    onBulletDeadFinish(bullet) {
        this.gameUI.removeBullet(bullet);
    }

    checkCreatePlayer() {
        if (this.tankApp.playerData.playerLives > 0) {
            this.tankApp.playerData.playerLives--;
            this.gameUI.createPlayer();
        }
    }

    checkGameState() {
        if (this.tankApp.playerData.levelEndType !== 0) return;

        do {
            if (this.gameUI.enemySpawner.isFinished()) {
                this.tankApp.playerData.levelEndType = 1;
                break;
            }

            if (!this.gameUI.home) {
                this.tankApp.playerData.levelEndType = 2;
                break;
            }

            if (!this.gameUI.player && this.tankApp.playerData.playerLives === 0) {
                this.tankApp.playerData.levelEndType = 2;
                break;
            }
        } while (0);

        if (this.tankApp.playerData.levelEndType) {
            this.tankApp.ticker.tickOnce(() => {
                this.tankApp.setScreen('TankEndUI');
            }, 1);
        }
    }

    makeDead() {}
}
