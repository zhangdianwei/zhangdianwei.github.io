import PlayEnemy from './PlayEnemy.js';
import { Dir, TankBoundaryThreshold, TankSize, TankType, TileSize } from './TileType.js';

const SpawnInterval = 1.2;
const SpawnRetryInterval = 0.2;

export default class PlayEnemySpawner {
    init(dialog) {
        this.dialog = dialog;
        this.spawnIndex = 1; // 0=左, 1=中, 2=右
        this.spawnCount = 0;
        this.spawnTimer = 0;
        this.enemyQueue = null;
    }

    update(deltaTime) {
        const gameView = this.dialog.gameView;
        const map = gameView.map;
        if (!this.enemyQueue) this.enemyQueue = this.createEnemyQueue(map.config);
        if (this.spawnCount >= this.enemyQueue.length) return;
        if (gameView.enemies.length >= map.config.maxEnemiesOnScreen) {
            this.spawnTimer = SpawnInterval;
            return;
        }

        this.spawnTimer -= deltaTime;
        if (this.spawnTimer > 0) return;

        const start = this.findStartPosition();
        if (!start) {
            this.spawnTimer = SpawnRetryInterval;
            return;
        }

        this.createEnemy(this.enemyQueue[this.spawnCount], start);
        this.spawnTimer = SpawnInterval;
    }

    isFinished() {
        const gameView = this.dialog.gameView;
        return this.spawnCount >= gameView.map.config.totalEnemies && gameView.enemies.length === 0;
    }

    getRemainingEnemies(){
        const destroyed = this.dialog.app.data.enermyDestroyed.reduce((sum, count) => sum + (count || 0), 0);
        return Math.max(0, this.dialog.gameView.map.config.totalEnemies - destroyed);
    }

    createEnemy(enemyType, start) {
        const enemy = new PlayEnemy(this.dialog, enemyType);
        const {r, c} = start;
        enemy.x = c * TileSize;
        enemy.y = r * TileSize;
        enemy.setDirection(Dir.DOWN);
        enemy.appear();

        this.dialog.gameView.addEnemy(enemy);
        this.spawnCount++;
    }

    createEnemyQueue(config) {
        const counts = config.enemyCounts || [config.totalEnemies, 0, 0, 0];
        const remaining = counts.slice();
        const scores = counts.map(() => 0);
        const total = counts.reduce((sum, count) => sum + count, 0);
        const queue = [];

        while (queue.length < total) {
            let selected = -1;
            for (let i = 0; i < remaining.length; i++) {
                if (remaining[i] <= 0) continue;
                scores[i] += counts[i];
                if (selected === -1 || scores[i] > scores[selected]) selected = i;
            }
            queue.push(TankType.ENEMY_1 + selected);
            scores[selected] -= total;
            remaining[selected]--;
        }
        return queue;
    }

    findStartPosition() {
        const starts = this.getStartPositions();
        for (let offset = 0; offset < starts.length; offset++) {
            const index = (this.spawnIndex + offset) % starts.length;
            const start = starts[index];
            if (!this.isStartPositionClear(start)) continue;
            this.spawnIndex = (index + 1) % starts.length;
            return start;
        }
        return null;
    }

    getStartPositions(){
        const mapCols = this.dialog.gameView.map.mapCols;
        return [
            {r: 1, c: 1},
            {r: 1, c: Math.floor(mapCols / 2)},
            {r: 1, c: mapCols - 1},
        ];
    }

    isStartPositionClear({r, c}) {
        const gameView = this.dialog.gameView;
        const size = TankSize - TankBoundaryThreshold * 2;
        const bounds = {x: c * TileSize, y: r * TileSize, width: size, height: size};
        if (!gameView.map.isRectWalkable(bounds.x, bounds.y, size / 2)) return false;
        return [gameView.player, ...gameView.enemies]
            .filter((tank) => tank && !tank.isDead)
            .every((tank) => !this.dialog.ruleMgr.checkBoundsOverlap(bounds, tank.getOccupancyBounds()));
    }

    destroy() {
        this.dialog = null;
    }
}
