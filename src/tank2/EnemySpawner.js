import { TankApp } from './TankApp.js';
import TankBase from './TankBase.js';
import TankEnemy from './TankEnemy.js';
import { TileSize, TankType } from './TileType.js';

export default class EnemySpawner {
    constructor() {
        this.tankApp = TankApp.instance;
        this.spawnIndex = 1; // 0=左, 1=中, 2=右
    }

    update(deltaTime) {
        this.checkCreateEnemy();
    }

    checkCreateEnemy() {
        const levelData = this.tankApp.ui.map;
        if (!levelData || !levelData.config) return;

        // const maxEnemiesOnScreen = levelData.config.maxEnemiesOnScreen || 3;
        const maxEnemiesOnScreen = 3;
        const currentEnemies = this.tankApp.ui.enemies.length;

        if (currentEnemies < maxEnemiesOnScreen && levelData.spawnEnemy()) {
            this.createEnemy();
        }
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
        
        this.tankApp.addEnemy(enemy);
    }

    getStartRC(){
        switch (this.spawnIndex) {
            case 0: // 左
                return {r: 1, c: 1};
            case 1: // 中
                return {r: 1, c: Math.floor(this.tankApp.ui.map.mapCols / 2)};
            case 2: // 右
                return {r: 1, c: this.tankApp.ui.map.mapCols - 1};
        }
    }

    reset() {
        this.spawnIndex = 0;
    }
} 