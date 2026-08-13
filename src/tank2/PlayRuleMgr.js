import { MapWidth, MapHeight } from './TileType.js';
import ResultDialog from './ResultDialog.js';

export default class PlayRuleMgr {
    init(dialog) {
        this.dialog = dialog;
    }

    update() {
        const app = this.dialog.app;
        if (app.data.levelEndType !== 0) return;

        const deltaTime = app.pixi.ticker.deltaMS / 1000;
        const gameView = this.dialog.gameView;

        this.dialog.enemySpawner.update(deltaTime);

        if (gameView.player) {
            gameView.player.update(deltaTime);
        }

        gameView.enemies.forEach((enemy) => {
            enemy.update(deltaTime);
        });

        this.resolveAllTankOverlaps();

        gameView.playerBullets.forEach((bullet) => {
            bullet.update(deltaTime);
        });

        gameView.enemyBullets.forEach((bullet) => {
            bullet.update(deltaTime);
        });

        gameView.updateEffects(deltaTime);

        this.checkCollisions();
    }

    resolveAllTankOverlaps() {
        const gameView = this.dialog.gameView;
        const tanks = [gameView.player, ...gameView.enemies].filter((t) => t && !t.isDead);
        if (tanks.length < 2) return;

        // 小迭代次数即可处理常见链式重叠
        for (let iter = 0; iter < 4; iter++) {
            let changed = false;
            for (let i = 0; i < tanks.length; i++) {
                for (let j = i + 1; j < tanks.length; j++) {
                    if (this.resolvePairOverlap(tanks[i], tanks[j], tanks)) {
                        changed = true;
                    }
                }
            }
            if (!changed) break;
        }
    }

    resolvePairOverlap(tankA, tankB, allTanks) {
        const a = tankA.getBounds();
        const b = tankB.getBounds();
        if (!this.checkBoundsOverlap(a, b)) return false;

        const aLeft = a.x - a.width / 2;
        const aRight = a.x + a.width / 2;
        const aTop = a.y - a.height / 2;
        const aBottom = a.y + a.height / 2;
        const bLeft = b.x - b.width / 2;
        const bRight = b.x + b.width / 2;
        const bTop = b.y - b.height / 2;
        const bBottom = b.y + b.height / 2;

        const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
        const overlapY = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);
        if (overlapX <= 0 || overlapY <= 0) return false;

        const epsilon = 0.01;
        let moveAX = 0, moveAY = 0, moveBX = 0, moveBY = 0;

        if (overlapX <= overlapY) {
            const dir = a.x <= b.x ? -1 : 1;
            const sep = (overlapX + epsilon) / 2;
            moveAX = dir * sep;
            moveBX = -dir * sep;
        } else {
            const dir = a.y <= b.y ? -1 : 1;
            const sep = (overlapY + epsilon) / 2;
            moveAY = dir * sep;
            moveBY = -dir * sep;
        }

        const aCanHalf = this.canPlaceTank(tankA, tankA.x + moveAX, tankA.y + moveAY, allTanks, tankB);
        const bCanHalf = this.canPlaceTank(tankB, tankB.x + moveBX, tankB.y + moveBY, allTanks, tankA);

        if (aCanHalf) {
            tankA.x += moveAX;
            tankA.y += moveAY;
        }
        if (bCanHalf) {
            tankB.x += moveBX;
            tankB.y += moveBY;
        }
        if (aCanHalf || bCanHalf) return true;

        // 半分都不可行，尝试只移动一侧全部位移
        const fullAX = moveAX * 2;
        const fullAY = moveAY * 2;
        const fullBX = moveBX * 2;
        const fullBY = moveBY * 2;

        if (this.canPlaceTank(tankA, tankA.x + fullAX, tankA.y + fullAY, allTanks, tankB)) {
            tankA.x += fullAX;
            tankA.y += fullAY;
            return true;
        }
        if (this.canPlaceTank(tankB, tankB.x + fullBX, tankB.y + fullBY, allTanks, tankA)) {
            tankB.x += fullBX;
            tankB.y += fullBY;
            return true;
        }

        return false;
    }

    canPlaceTank(tank, targetX, targetY, allTanks, ignoreTank) {
        const half = tank.size / 2;
        if (!this.dialog.gameView.map.isRectWalkable(targetX, targetY, half)) {
            return false;
        }

        const candidate = {
            x: targetX,
            y: targetY,
            width: tank.size,
            height: tank.size
        };
        for (const other of allTanks) {
            if (!other || other === tank || other === ignoreTank || other.isDead) continue;
            if (this.checkBoundsOverlap(candidate, other.getBounds())) {
                return false;
            }
        }
        return true;
    }

    checkCollisions() {
        const gameView = this.dialog.gameView;
        const playerBullets = gameView.playerBullets.concat();
        const enemyBullets = gameView.enemyBullets.concat();
        const allBullets = [...playerBullets, ...enemyBullets];
        const player = gameView.player;
        const enemies = gameView.enemies;

        // 子弹与地图碰撞
        for (let i = 0; i < allBullets.length; i++) {
            gameView.map.checkCollisionBullet(allBullets[i]);
        }

        // 子弹与基地碰撞
        if (gameView.home && !gameView.home.isDead) {
            for (let i = 0; i < allBullets.length; i++) {
                const bullet = allBullets[i];
                if (gameView.home.checkCollision(bullet.x, bullet.y)) {
                    gameView.home.takeDamage(bullet.power);
                    bullet.makeDead();
                }
            }
        }

        // 子弹与敌人碰撞
        playerBullets.forEach((bullet) => {
            enemies.forEach((enemy) => {
                if (this.checkBulletTankCollision(bullet, enemy)) {
                    enemy.takeDamage(bullet.power);
                    bullet.makeDead();
                }
            });
        });

        // 子弹与玩家碰撞
        enemyBullets.forEach((bullet) => {
            if (player && this.checkBulletTankCollision(bullet, player)) {
                player.takeDamage(bullet.power);
                bullet.makeDead();
            }
        });

        // 子弹与子弹碰撞
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

    // 只判断坦克
    getMovableDistance(bounds, direction, excludeTank = null) {
        const gameView = this.dialog.gameView;
        const allTanks = [gameView.player, ...gameView.enemies].filter((t) => t && t !== excludeTank);
        const selfLeft = bounds.x - bounds.width / 2;
        const selfRight = bounds.x + bounds.width / 2;
        const selfTop = bounds.y - bounds.height / 2;
        const selfBottom = bounds.y + bounds.height / 2;

        let minDistance = Infinity;

        for (const tank of allTanks) {
            const tankBounds = tank.getBounds();
            const otherLeft = tankBounds.x - tankBounds.width / 2;
            const otherRight = tankBounds.x + tankBounds.width / 2;
            const otherTop = tankBounds.y - tankBounds.height / 2;
            const otherBottom = tankBounds.y + tankBounds.height / 2;

            const overlapX = selfLeft < otherRight && selfRight > otherLeft;
            const overlapY = selfTop < otherBottom && selfBottom > otherTop;
            if (overlapX && overlapY) {
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
        return Math.max(0, Math.floor(minDistance));
    }

    isInBounds(x, y) {
        return x >= 0 && x < MapWidth && y >= 0 && y < MapHeight;
    }

    onTankDeadFinish(tank) {
        const gameView = this.dialog.gameView;
        if (tank === gameView.player) {
            gameView.removePlayer(tank);
            this.checkCreatePlayer();
        } else {
            gameView.removeEnemy(tank);
            this.dialog.app.addEnemyDestroyed(tank.tankType, 1);
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

    checkCreatePlayer() {
        const app = this.dialog.app;
        if (app.data.playerLives > 0) {
            app.data.playerLives--;
            this.dialog.gameView.createPlayer();
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

            if (!gameView.player && app.data.playerLives === 0) {
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
