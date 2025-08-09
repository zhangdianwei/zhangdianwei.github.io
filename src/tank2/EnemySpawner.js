import { TankApp } from './TankApp.js';

export default class EnemySpawner {
    constructor() {
        this.tankApp = TankApp.instance;
        this.spawnTimer = 0;
        this.spawnInterval = 3;
    }

    update(deltaTime) {
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.tankApp.enemySpawner.spawnEnemy();
        }
    }

    reset() {
        this.spawnTimer = 0;
    }
} 