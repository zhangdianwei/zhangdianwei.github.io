import { TankApp } from './TankApp.js';
import TankBase from './TankBase.js';
import TankEnemy from './TankEnemy.js';
import { TileSize, TankType } from './TileType.js';

export default class TankCompEnemySpawner {
    constructor(gameUI) {
        this.gameUI = gameUI;
        this.spawnIndex = 1; // 0=左, 1=中, 2=右
        this.spawnCount = 0;
    }

    update(deltaTime) {
        const map = this.gameUI.map;
        const condition1 = this.gameUI.enemies.length < map.config.maxEnemiesOnScreen;
        const condition2 = this.spawnCount < map.config.totalEnemies;

        if (condition1 && condition2) {
            this.createEnemy();
        }
    }

    isFinished() {
        return this.spawnCount >= this.gameUI.map.config.totalEnemies && this.gameUI.enemies.length === 0;
    }

    createEnemy() {
        const enemyType = TankType.ENEMY_1 + (this.spawnIndex % 4); // 循环使用1-4种敌人类型
        const enemy = new TankEnemy(enemyType);
        
        const {r, c} = this.getStartRC();
        enemy.x = c * TileSize;
        enemy.y = r * TileSize;
        enemy.setDirection(2);
        enemy.appear();

        this.spawnIndex = (this.spawnIndex + 1) % 3;
        
        this.gameUI.addEnemy(enemy);

        this.spawnCount++;
    }

    getStartRC(){
        switch (this.spawnIndex) {
            case 0: // 左
                return {r: 1, c: 1};
            case 1: // 中
                return {r: 1, c: Math.floor(this.gameUI.map.mapCols / 2)};
            case 2: // 右
                return {r: 1, c: this.gameUI.map.mapCols - 1};
        }
    }

} 