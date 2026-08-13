import PlayEnemy from './PlayEnemy.js';
import { TileSize, TankType, Dir } from './TileType.js';

export default class PlayEnemySpawner {
    init(dialog) {
        this.dialog = dialog;
        this.spawnIndex = 1; // 0=左, 1=中, 2=右
        this.spawnCount = 0;
    }

    update() {
        const gameView = this.dialog.gameView;
        const map = gameView.map;
        const condition1 = gameView.enemies.length < map.config.maxEnemiesOnScreen;
        const condition2 = this.spawnCount < map.config.totalEnemies;

        if (condition1 && condition2) {
            this.createEnemy();
        }
    }

    isFinished() {
        const gameView = this.dialog.gameView;
        return this.spawnCount >= gameView.map.config.totalEnemies && gameView.enemies.length === 0;
    }

    getRemainingEnemies(){
        return this.dialog.gameView.map.config.totalEnemies - this.spawnCount;
    }

    createEnemy() {
        const enemyType = TankType.ENEMY_1 + (this.spawnIndex % 4); // 循环使用1-4种敌人类型
        const enemy = new PlayEnemy(this.dialog, enemyType);

        const {r, c} = this.getStartRC();
        enemy.x = c * TileSize;
        enemy.y = r * TileSize;
        enemy.setDirection(Dir.DOWN);
        enemy.appear();

        this.spawnIndex = (this.spawnIndex + 1) % 3;

        this.dialog.gameView.addEnemy(enemy);

        this.spawnCount++;
    }

    getStartRC(){
        const mapCols = this.dialog.gameView.map.mapCols;
        switch (this.spawnIndex) {
            case 0: // 左
                return {r: 1, c: 1};
            case 1: // 中
                return {r: 1, c: Math.floor(mapCols / 2)};
            case 2: // 右
                return {r: 1, c: mapCols - 1};
        }
    }

    destroy() {
        this.dialog = null;
    }
}
