import { TankApp } from './TankApp.js';
import TankBase from './TankBase.js';
import TankEnemy from './TankEnemy.js';
import { TileSize, TankType } from './TileType.js';

export default class TankCompEnemySpawner {
    constructor(gameUI) {
        this.gameUI = gameUI;
        this.spawnIndex = 1; // 0=左, 1=中, 2=右
    }

    update(deltaTime) {
        this.checkCreateEnemy();
    }

    checkCreateEnemy() {
        const map = this.gameUI.map;
        const condition1 = this.gameUI.enemies.length < map.config.maxEnemiesOnScreen;

        if (condition1) {
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
        
        this.gameUI.addEnemy(enemy);
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