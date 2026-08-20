import { Dir, MapWidth, MapHeight, TileType } from './TileType.js';
import { PowerUpType } from './PlayPowerUp.js';
import ResultDialog from './ResultDialog.js';

export default class PlayRuleMgr {
    init(dialog) {
        this.dialog = dialog;
        this.playerRespawnPending = false;
        this.playerRespawnTimer = 0;
        this.enemyFreezeTime = 0;
        this.helmetTime = 0;
        this.baseShieldTime = 0;
    }

    update() {
        const app = this.dialog.app;
        if (app.data.levelEndType !== 0) return;

        const deltaTime = Math.min(app.pixi.ticker.deltaMS / 1000, 0.05);
        const gameView = this.dialog.gameView;

        this.dialog.enemySpawner.update(deltaTime);
        this.updatePlayerRespawn(deltaTime);
        this.updatePowerUpTimers(deltaTime);

        if (gameView.player) {
            gameView.player.update(deltaTime);
        }

        gameView.enemies.slice().forEach((enemy) => {
            enemy.update(deltaTime, this.enemyFreezeTime > 0);
        });

        gameView.playerBullets.slice().forEach((bullet) => {
            bullet.update(deltaTime);
        });

        gameView.enemyBullets.slice().forEach((bullet) => {
            bullet.update(deltaTime);
        });

        gameView.updateEffects(deltaTime);
        gameView.updatePowerUp(deltaTime);

        this.checkCollisions();
    }

    checkCollisions() {
        const gameView = this.dialog.gameView;
        const playerBullets = gameView.playerBullets.concat();
        const enemyBullets = gameView.enemyBullets.concat();
        const allBullets = [...playerBullets, ...enemyBullets];
        const player = gameView.player;
        const enemies = gameView.enemies;

        if (player) gameView.powerUps.slice().forEach((powerUp) => {
            if (this.checkBoundsOverlap(player.getBounds(), powerUp.getBounds())) powerUp.collect(player);
        });

        // 子弹与地图碰撞
        for (let i = 0; i < allBullets.length; i++) {
            gameView.map.checkCollisionBullet(allBullets[i]);
        }

        // 子弹与基地碰撞
        if (gameView.home && !gameView.home.isDead) {
            for (let i = 0; i < allBullets.length; i++) {
                const bullet = allBullets[i];
                if (bullet.isDead) continue;
                if (gameView.home.checkCollision(bullet.x, bullet.y)) {
                    gameView.home.takeDamage(bullet.power);
                    bullet.hit();
                }
            }
        }

        // 子弹与敌人碰撞
        playerBullets.forEach((bullet) => {
            enemies.forEach((enemy) => {
                if (this.checkBulletTankCollision(bullet, enemy)) {
                    enemy.takeDamage(bullet.power);
                    bullet.hit();
                }
            });
        });

        // 子弹与玩家碰撞
        enemyBullets.forEach((bullet) => {
            if (player && this.checkBulletTankCollision(bullet, player)) {
                player.takeDamage(bullet.power);
                bullet.hit();
            }
        });

        // 子弹与子弹碰撞
        playerBullets.forEach((playerBullet) => {
            enemyBullets.forEach((enemyBullet) => {
                if (this.checkBulletBulletCollision(playerBullet, enemyBullet)) {
                    playerBullet.hit();
                    enemyBullet.hit();
                }
            });
        });
    }

    checkBulletTankCollision(bullet, tank) {
        if (!bullet || !tank || bullet.isDead || tank.isDead) return false;

        const bulletBounds = bullet.getBounds();
        const tankBounds = tank.getBounds();
        return this.checkBoundsOverlap(bulletBounds, tankBounds);
    }

    checkBulletBulletCollision(bullet1, bullet2) {
        if (!bullet1 || !bullet2 || bullet1.isDead || bullet2.isDead) return false;

        const bullet1Bounds = bullet1.getBounds();
        const bullet2Bounds = bullet2.getBounds();
        return this.checkBoundsOverlap(bullet1Bounds, bullet2Bounds);
    }

    checkBoundsOverlap(bounds1, bounds2) {
        const left1 = bounds1.x - bounds1.width / 2;
        const right1 = bounds1.x + bounds1.width / 2;
        const top1 = bounds1.y - bounds1.height / 2;
        const bottom1 = bounds1.y + bounds1.height / 2;

        const left2 = bounds2.x - bounds2.width / 2;
        const right2 = bounds2.x + bounds2.width / 2;
        const top2 = bounds2.y - bounds2.height / 2;
        const bottom2 = bounds2.y + bounds2.height / 2;

        return left1 < right2 &&
               right1 > left2 &&
               top1 < bottom2 &&
               bottom1 > top2;
    }

    getMovableDistance(bounds, direction, excludeTank = null) {
        const gameView = this.dialog.gameView;
        const obstacles = [gameView.home, gameView.player, ...gameView.enemies]
            .filter((item) => item && item !== excludeTank && !item.isDead);
        const selfLeft = bounds.x - bounds.width / 2;
        const selfRight = bounds.x + bounds.width / 2;
        const selfTop = bounds.y - bounds.height / 2;
        const selfBottom = bounds.y + bounds.height / 2;

        let minDistance = Infinity;

        for (const obstacle of obstacles) {
            const obstacleBounds = obstacle.getOccupancyBounds();
            const otherLeft = obstacleBounds.x - obstacleBounds.width / 2;
            const otherRight = obstacleBounds.x + obstacleBounds.width / 2;
            const otherTop = obstacleBounds.y - obstacleBounds.height / 2;
            const otherBottom = obstacleBounds.y + obstacleBounds.height / 2;

            const overlapX = selfLeft < otherRight && selfRight > otherLeft;
            const overlapY = selfTop < otherBottom && selfBottom > otherTop;
            if (overlapX && overlapY) {
                const separating =
                    direction === Dir.UP && bounds.y <= obstacleBounds.y ||
                    direction === Dir.RIGHT && bounds.x >= obstacleBounds.x ||
                    direction === Dir.DOWN && bounds.y >= obstacleBounds.y ||
                    direction === Dir.LEFT && bounds.x <= obstacleBounds.x;
                if (separating) continue;
                return 0;
            }

            let crossAxisOverlap = false;
            let distance = Infinity;

            if (direction === 0) {
                crossAxisOverlap = selfLeft < otherRight && selfRight > otherLeft;
                if (crossAxisOverlap) {
                    distance = selfTop - otherBottom;
                }
            } else if (direction === 1) {
                crossAxisOverlap = selfTop < otherBottom && selfBottom > otherTop;
                if (crossAxisOverlap) {
                    distance = otherLeft - selfRight;
                }
            } else if (direction === 2) {
                crossAxisOverlap = selfLeft < otherRight && selfRight > otherLeft;
                if (crossAxisOverlap) {
                    distance = otherTop - selfBottom;
                }
            } else if (direction === 3) {
                crossAxisOverlap = selfTop < otherBottom && selfBottom > otherTop;
                if (crossAxisOverlap) {
                    distance = selfLeft - otherRight;
                }
            }

            if (!crossAxisOverlap) continue;
            if (distance >= 0 && distance < minDistance) {
                minDistance = distance;
            }
        }

        if (!Number.isFinite(minDistance)) {
            return minDistance;
        }
        return Math.max(0, minDistance);
    }

    isInBounds(x, y) {
        return x >= 0 && x < MapWidth && y >= 0 && y < MapHeight;
    }

    onTankDeadFinish(tank) {
        const gameView = this.dialog.gameView;
        if (tank === gameView.player) {
            this.dialog.app.data.playerStarLevel = 0;
            this.helmetTime = 0;
            gameView.removePlayer(tank);
            this.checkCreatePlayer();
        } else {
            gameView.removeEnemy(tank);
            this.dialog.app.addEnemyDestroyed(tank.tankType, 1);
            if (!tank.suppressPowerUpDrop) gameView.spawnPowerUp();
        }
        this.dialog.hudView.updateView();
        this.checkGameState();
    }

    onHomeDeadFinish() {
        this.dialog.gameView.home = null;
        this.checkGameState();
    }

    onBulletDeadFinish(bullet) {
        this.dialog.gameView.removeBullet(bullet);
    }

    applyPowerUp(type, player) {
        const gameView = this.dialog.gameView;
        if (type === PowerUpType.STAR) player?.upgradeBullet();
        if (type === PowerUpType.HELMET) {
            this.helmetTime = 10;
            player?.setInvincible(10);
        }
        if (type === PowerUpType.TANK) {
            this.dialog.app.data.playerLives++;
            this.dialog.hudView.updateView();
        }
        if (type === PowerUpType.CLOCK) this.enemyFreezeTime = 10;
        if (type === PowerUpType.SHOVEL) {
            this.baseShieldTime = 21.3;
            gameView.map.setHomeWallType(TileType.IRON);
            gameView.map.setHomeWallTint(0xFFFFFF);
        }
        if (type === PowerUpType.GRENADE) gameView.enemies.slice().forEach((enemy) => {
            if (enemy.isDead) return;
            enemy.suppressPowerUpDrop = true;
            enemy.makeDead();
        });
        this.dialog.hudView.updatePowerUpStatus();
    }

    updatePowerUpTimers(deltaTime) {
        this.enemyFreezeTime = Math.max(0, this.enemyFreezeTime - deltaTime);
        this.helmetTime = Math.max(0, this.helmetTime - deltaTime);
        this.dialog.hudView.updatePowerUpStatus();
        if (this.baseShieldTime <= 0) return;
        this.baseShieldTime -= deltaTime;
        const map = this.dialog.gameView.map;
        if (this.baseShieldTime > 0 && this.baseShieldTime <= 3) {
            map.setHomeWallTint(Math.floor(this.baseShieldTime * 5) % 2 ? 0xFFFFFF : 0xFFD15A);
        }
        if (this.baseShieldTime <= 0) {
            map.setHomeWallType(TileType.BRICK);
            map.setHomeWallTint(0xFFFFFF);
        }
    }

    checkCreatePlayer() {
        const app = this.dialog.app;
        if (app.data.playerLives > 0) {
            app.data.playerLives--;
            this.playerRespawnPending = true;
            this.playerRespawnTimer = 0.4;
        }
    }

    updatePlayerRespawn(deltaTime) {
        if (!this.playerRespawnPending) return;
        this.playerRespawnTimer -= deltaTime;
        if (this.playerRespawnTimer > 0) return;
        if (this.dialog.gameView.createPlayer()) {
            this.playerRespawnPending = false;
        } else {
            this.playerRespawnTimer = 0.2;
        }
    }

    checkGameState() {
        const app = this.dialog.app;
        if (app.data.levelEndType !== 0) return;
        const gameView = this.dialog.gameView;

        do {
            if (this.dialog.enemySpawner.isFinished()) {
                app.data.levelEndType = 1;
                break;
            }

            if (!gameView.home) {
                app.data.levelEndType = 2;
                break;
            }

            if (!gameView.player && app.data.playerLives === 0 && !this.playerRespawnPending) {
                app.data.levelEndType = 2;
                break;
            }
        } while (0);

        if (app.data.levelEndType) {
            this.dialog.timeout(() => {
                app.dialogMgr.replace(ResultDialog);
            }, 1000);
        }
    }

    destroy() {
        this.dialog = null;
    }
}
