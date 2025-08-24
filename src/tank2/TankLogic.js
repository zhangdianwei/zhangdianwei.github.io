import * as PIXI from 'pixi.js';
import { createPixi, initDom } from '../pixi/PixiHelper.js';
import { TankApp } from './TankApp.js';
import TankLevelData from './TankLevelData.js';
import InputManager from './InputManager.js';
import EnemySpawner from './EnemySpawner.js';
import Enemy from './Enemy.js';
import Bullet from './Bullet.js';

export class TankLogic {
    constructor() {
        this.tankApp = TankApp.instance;
        
        // 游戏状态
        this.isPaused = false;
        this.isGameOver = false;
        
        // 管理器
        this.levelData = null;
        this.mapRenderer = null;
        this.inputManager = null;
        this.enemySpawner = null;
    }

    init(domElement) {
        // 初始化DOM尺寸
        initDom(domElement, {
            designWidth: 1920/2,
            designHeight: 1080/2,
            isFullScreen: true
        });
        
        this.tankApp.pixi = createPixi(domElement);
        this.tankApp.gameContainer = new PIXI.Container();
        this.tankApp.pixi.stage.addChild(this.tankApp.gameContainer);

        // 创建渲染层
        this.createRenderLayers();
        
        // 创建管理器
        this.inputManager = new InputManager();
        this.enemySpawner = new EnemySpawner();
        
        // 创建关卡数据
        this.tankApp.levelData = new TankLevelData();
        
        // 设置游戏循环
        this.tankApp.pixi.ticker.add(this.update.bind(this));
        
        // 设置输入监听
        this.inputManager.setupInput();
        
        // 开始游戏
        this.tankApp.levelData.startLevel();
    }

    spawnEnemy() {
        const levelData = this.tankApp.levelData;
        if (this.tankApp.enemies.length >= levelData.config.maxEnemiesOnScreen || 
            !levelData.spawnEnemy()) {
            return;
        }
        
        const spawnPoints = [
            { x: 32, y: 32 },
            { x: 416, y: 32 },
            { x: 800, y: 32 }
        ];
        
        const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        
        // 根据配置的概率选择敌人类型
        const random = Math.random();
        let enemyType = 1;
        const rates = levelData.config.enemySpawnRates;
        
        if (random < rates.type1) enemyType = 1;
        else if (random < rates.type1 + rates.type2) enemyType = 2;
        else if (random < rates.type1 + rates.type2 + rates.type3) enemyType = 3;
        else enemyType = 4;
        
        const enemy = new Enemy(enemyType);
        enemy.x = spawnPoint.x;
        enemy.y = spawnPoint.y;
        
        // 监听敌人事件
        enemy.on('destroyed', () => {
            levelData.enemyDestroyed();
            levelData.addScore(100);
            this.tankApp.enemies = this.tankApp.enemies.filter(e => e !== enemy);
            this.tankApp.renderLayers.enemies.removeChild(enemy);
        });
        
        enemy.on('shoot', (direction) => {
            this.createEnemyBullet(enemy, direction);
        });
        
        enemy.spawn();
        this.tankApp.enemies.push(enemy);
        this.tankApp.renderLayers.enemies.addChild(enemy);
    }

    createPlayerBullet(direction) {
        const bullet = new Bullet(this.tankApp.player, direction);
        bullet.x = this.tankApp.player.x;
        bullet.y = this.tankApp.player.y;
        
        // 监听子弹事件
        bullet.on('destroyed', () => {
            this.tankApp.bullets = this.tankApp.bullets.filter(b => b !== bullet);
            this.tankApp.renderLayers.bullets.removeChild(bullet);
        });
        
        this.tankApp.bullets.push(bullet);
        this.tankApp.renderLayers.bullets.addChild(bullet);
    }

    createEnemyBullet(enemy, direction) {
        const bullet = new Bullet(enemy, direction);
        bullet.x = enemy.x;
        bullet.y = enemy.y;
        
        // 监听子弹事件
        bullet.on('destroyed', () => {
            this.tankApp.bullets = this.tankApp.bullets.filter(b => b !== bullet);
            this.tankApp.renderLayers.bullets.removeChild(bullet);
        });
        
        this.tankApp.bullets.push(bullet);
        this.tankApp.renderLayers.bullets.addChild(bullet);
    }

    updateGameObjects(deltaTime) {
        // 更新玩家
        if (this.tankApp.player) {
            this.tankApp.player.update(deltaTime);
        }
        
        // 更新敌人
        this.tankApp.enemies.forEach(enemy => {
            enemy.update(deltaTime);
            enemy.updateAI(deltaTime, this.tankApp.levelData);
        });
        
        // 更新子弹
        this.tankApp.bullets.forEach(bullet => {
            bullet.update(deltaTime);
        });
    }

    cleanup() {
        // 清理已销毁的对象
        this.tankApp.bullets = this.tankApp.bullets.filter(bullet => !bullet.isDestroyed);
        this.tankApp.enemies = this.tankApp.enemies.filter(enemy => enemy.parent);
    }

    resetGameObjects() {
        this.tankApp.player = null;
        this.tankApp.enemies = [];
        this.tankApp.bullets = [];
    }







    update(deltaTime) {
        if (this.isPaused || this.isGameOver) return;
        
        const dt = deltaTime / this.tankApp.pixi.ticker.FPS;
        
        // 更新玩家输入
        this.inputManager.updatePlayerInput();
        
        // 更新游戏对象
        this.updateGameObjects(dt);
        
        // 更新敌人生成
        this.enemySpawner.update(dt);
        
        // 更新关卡数据
        this.tankApp.levelData.updateEffects(dt);
        
        // 碰撞检测
        this.checkCollisions();
        
        // 清理销毁的对象
        this.cleanup();
        
        // 检查游戏状态
        this.checkGameState();
    }



    isWalkable(worldX, worldY) {
        const { row, col } = this.mapRenderer.worldToGrid(worldX, worldY);
        
        if (row < 0 || row >= 24 || col < 0 || col >= 26) {
            return false;
        }
        return this.tankApp.levelData.isWalkable(row, col);
    }

    checkCollisions() {
        const bullets = this.tankApp.bullets;
        const player = this.tankApp.player;
        const enemies = this.tankApp.enemies;
        
        // 子弹与地图碰撞
        bullets.forEach(bullet => {
            const { row, col } = this.mapRenderer.worldToGrid(bullet.x, bullet.y);
            
            if (row >= 0 && row < 24 && col >= 0 && col < 26) {
                if (this.tankApp.levelData.isDestructible(row, col)) {
                    this.tankApp.levelData.setTileType(row, col, 0);
                    bullet.destroy();
                }
            }
        });
        
        // 子弹与坦克碰撞
        bullets.forEach(bullet => {
            // 检查与玩家碰撞
            if (player && bullet.owner !== player && bullet.checkCollision(player)) {
                player.takeDamage();
                bullet.destroy();
            }
            
            // 检查与敌人碰撞
            enemies.forEach(enemy => {
                if (bullet.owner !== enemy && bullet.checkCollision(enemy)) {
                    enemy.takeDamage();
                    bullet.destroy();
                }
            });
        });
    }



    checkGameState() {
        // 检查关卡是否完成
        if (this.tankApp.levelData.isLevelComplete()) {
            this.nextLevel();
        }
        
        // 检查基地是否被摧毁
        if (this.tankApp.levelData.isBaseDestroyed()) {
            this.gameOver();
        }
    }

    gameOver() {
        this.isGameOver = true;
        console.log('游戏结束！');
    }

    nextLevel() {
        this.tankApp.levelData.nextLevel();
        this.startLevel();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    restart() {
        this.tankApp.levelData.reset();
        this.resetGameObjects();
        this.enemySpawner.reset();
        this.isGameOver = false;
        this.isPaused = false;
        this.startLevel();
    }

    destroy() {
        if (this.tankApp.pixi) {
            this.tankApp.pixi.destroy(true);
        }
        
        this.inputManager.destroy();
    }

    createRenderLayers() {
        // 按照文档要求的渲染层级
        this.tankApp.renderLayers.background = new PIXI.Container(); // RenderLayer1: 空地背景
        this.tankApp.renderLayers.tiles = new PIXI.Container();      // RenderLayer2: 砖块、铁块、水面、老窝
        this.tankApp.renderLayers.enemies = new PIXI.Container();    // RenderLayer3: 敌人坦克
        this.tankApp.renderLayers.player = new PIXI.Container();     // RenderLayer4: 玩家坦克
        this.tankApp.renderLayers.bullets = new PIXI.Container();    // RenderLayer5: 子弹层
        this.tankApp.renderLayers.grass = new PIXI.Container();      // RenderLayer6: 草地（装饰层）
        
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.background);
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.tiles);
        this.tankApp.renderLayers.enemies.zIndex = 3;
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.enemies);
        this.tankApp.renderLayers.player.zIndex = 4;
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.player);
        this.tankApp.renderLayers.bullets.zIndex = 5;
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.bullets);
        this.tankApp.renderLayers.grass.zIndex = 6;
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.grass);
    }

} 