import * as PIXI from 'pixi.js';
import { createPixi, initDom } from '../pixi/PixiHelper.js';
import { TankApp } from './TankApp.js';
import TankLevelData from './TankLevelData.js';
import Player from './Player.js';
import Enemy from './Enemy.js';
import Bullet from './Bullet.js';
import MapRenderer from './MapRenderer.js';

export class TankLogic {
    constructor() {
        this.tankApp = TankApp.instance;
        this.gameObjects = [];
        
        // 游戏状态
        this.level = 1;
        this.lives = 3;
        this.score = 0;
        this.isPaused = false;
        this.isGameOver = false;
        
        // 输入状态
        this.keys = {};
        this.lastShootTime = 0;
        this.shootCooldown = 0.3;
        
        // 游戏对象
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.levelData = null;
        this.mapRenderer = null;
        
        // 敌人生成
        this.spawnTimer = 0;
        this.spawnInterval = 3;
        this.enemiesSpawned = 0;
        
        // 渲染层
        this.renderLayers = {
            background: null,
            tiles: null,
            enemies: null,
            player: null,
            bullets: null,
            grass: null
        };
    }

    init(domElement) {
        // 初始化DOM尺寸
        initDom(domElement, {
            designWidth: 1920,
            designHeight: 1080,
            isFullScreen: true
        });
        
        this.tankApp.pixi = createPixi(domElement);
        this.tankApp.gameContainer = new PIXI.Container();
        this.tankApp.pixi.stage.addChild(this.tankApp.gameContainer);
        
        // 创建渲染层
        this.createRenderLayers();
        
        // 创建地图渲染器
        this.mapRenderer = new MapRenderer(this.tankApp.textures);
        
        // 设置游戏循环
        this.tankApp.pixi.ticker.add(this.update.bind(this));
        
        // 设置输入监听
        this.setupInput();
        
        // 开始游戏
        this.startLevel();
    }

    createRenderLayers() {
        // 按照文档要求的渲染层级
        this.renderLayers.background = new PIXI.Container(); // RenderLayer1: 空地背景
        this.renderLayers.tiles = new PIXI.Container();      // RenderLayer2: 砖块、铁块、水面、老窝
        this.renderLayers.enemies = new PIXI.Container();    // RenderLayer3: 敌人坦克
        this.renderLayers.player = new PIXI.Container();     // RenderLayer4: 玩家坦克
        this.renderLayers.bullets = new PIXI.Container();    // RenderLayer5: 子弹层
        this.renderLayers.grass = new PIXI.Container();      // RenderLayer6: 草地（装饰层）
        
        this.tankApp.gameContainer.addChild(this.renderLayers.background);
        this.tankApp.gameContainer.addChild(this.renderLayers.tiles);
        this.renderLayers.enemies.zIndex = 3;
        this.tankApp.gameContainer.addChild(this.renderLayers.enemies);
        this.renderLayers.player.zIndex = 4;
        this.tankApp.gameContainer.addChild(this.renderLayers.player);
        this.renderLayers.bullets.zIndex = 5;
        this.tankApp.gameContainer.addChild(this.renderLayers.bullets);
        this.renderLayers.grass.zIndex = 6;
        this.tankApp.gameContainer.addChild(this.renderLayers.grass);
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.shoot();
                    break;
                case 'KeyP':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case 'KeyR':
                    e.preventDefault();
                    this.restart();
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    startLevel() {
        // 创建关卡数据
        this.levelData = new TankLevelData().generateLevel1();
        
        // 渲染地图
        this.mapRenderer.renderMap(this.levelData, this.renderLayers);
        
        // 重置游戏状态
        this.enemiesSpawned = 0;
        
        // 创建玩家坦克
        this.createPlayer();
    }

    createPlayer() {
        this.player = new Player(this.tankApp.textures);
        this.player.x = 416; // 地图中心
        this.player.y = 720; // 底部
        
        // 监听玩家事件
        this.player.on('destroyed', () => {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.createPlayer();
            }
        });
        
        this.player.spawn();
        this.renderLayers.player.addChild(this.player);
    }

    spawnEnemy() {
        if (this.enemies.length >= this.levelData.maxEnemiesOnScreen || 
            this.enemiesSpawned >= this.levelData.totalEnemies) {
            return;
        }
        
        const spawnPoints = [
            { x: 32, y: 32 },
            { x: 416, y: 32 },
            { x: 800, y: 32 }
        ];
        
        const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        const enemyType = Math.floor(Math.random() * 4) + 1;
        
        const enemy = new Enemy(enemyType, this.tankApp.textures);
        enemy.x = spawnPoint.x;
        enemy.y = spawnPoint.y;
        
        // 监听敌人事件
        enemy.on('destroyed', () => {
            this.score += 100;
            this.enemies = this.enemies.filter(e => e !== enemy);
            this.renderLayers.enemies.removeChild(enemy);
        });
        
        enemy.on('shoot', (direction) => {
            this.createEnemyBullet(enemy, direction);
        });
        
        enemy.spawn();
        this.enemies.push(enemy);
        this.renderLayers.enemies.addChild(enemy);
        this.enemiesSpawned++;
    }

    shoot() {
        if (!this.player || this.isPaused || this.isGameOver) return;
        
        const now = Date.now() / 1000;
        if (now - this.lastShootTime < this.shootCooldown) return;
        
        this.lastShootTime = now;
        
        this.createPlayerBullet(this.player.direction);
    }

    createPlayerBullet(direction) {
        const bullet = new Bullet(this.player, direction, 1);
        bullet.x = this.player.x;
        bullet.y = this.player.y;
        
        // 监听子弹事件
        bullet.on('destroyed', () => {
            this.bullets = this.bullets.filter(b => b !== bullet);
            this.renderLayers.bullets.removeChild(bullet);
        });
        
        this.bullets.push(bullet);
        this.renderLayers.bullets.addChild(bullet);
    }

    createEnemyBullet(enemy, direction) {
        const bullet = new Bullet(enemy, direction, 1);
        bullet.x = enemy.x;
        bullet.y = enemy.y;
        
        // 监听子弹事件
        bullet.on('destroyed', () => {
            this.bullets = this.bullets.filter(b => b !== bullet);
            this.renderLayers.bullets.removeChild(bullet);
        });
        
        this.bullets.push(bullet);
        this.renderLayers.bullets.addChild(bullet);
    }

    update(deltaTime) {
        if (this.isPaused || this.isGameOver) return;
        
        const dt = deltaTime / 60;
        
        // 更新玩家输入
        this.updatePlayerInput();
        
        // 更新玩家
        if (this.player) {
            this.player.update(dt);
        }
        
        // 更新敌人
        this.enemies.forEach(enemy => {
            enemy.update(dt);
            enemy.updateAI(dt, this.levelData);
        });
        
        // 更新子弹
        this.bullets.forEach(bullet => {
            bullet.update(dt);
        });
        
        // 生成敌人
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }
        
        // 碰撞检测
        this.checkCollisions();
        
        // 清理销毁的对象
        this.cleanup();
        
        // 检查游戏状态
        this.checkGameState();
    }

    updatePlayerInput() {
        if (!this.player) return;
        
        let direction = -1;
        
        if (this.keys['ArrowUp']) {
            direction = 0;
        } else if (this.keys['ArrowRight']) {
            direction = 1;
        } else if (this.keys['ArrowDown']) {
            direction = 2;
        } else if (this.keys['ArrowLeft']) {
            direction = 3;
        }
        
        if (direction >= 0) {
            const speed = this.player.speed;
            const radians = (direction * 90) * Math.PI / 180;
            const dx = Math.sin(radians) * speed;
            const dy = -Math.cos(radians) * speed;
            
            const newX = this.player.x + dx;
            const newY = this.player.y + dy;
            
            if (this.isWalkable(newX, newY)) {
                this.player.move(direction);
            } else {
                this.player.setDirection(direction);
            }
        } else {
            this.player.stop();
        }
    }

    isWalkable(worldX, worldY) {
        const { row, col } = this.mapRenderer.worldToGrid(worldX, worldY);
        
        if (row < 0 || row >= 24 || col < 0 || col >= 26) {
            return false;
        }
        
        return this.levelData.isWalkable(row, col);
    }

    checkCollisions() {
        // 子弹与地图碰撞
        this.bullets.forEach(bullet => {
            const { row, col } = this.mapRenderer.worldToGrid(bullet.x, bullet.y);
            
            if (row >= 0 && row < 24 && col >= 0 && col < 26) {
                if (this.levelData.isDestructible(row, col)) {
                    this.levelData.setTileType(row, col, 0);
                    this.mapRenderer.destroyTile(row, col, this.renderLayers);
                    bullet.destroy();
                }
            }
        });
        
        // 子弹与坦克碰撞
        this.bullets.forEach(bullet => {
            // 检查与玩家碰撞
            if (this.player && bullet.owner !== this.player && bullet.checkCollision(this.player)) {
                this.player.takeDamage();
                bullet.destroy();
            }
            
            // 检查与敌人碰撞
            this.enemies.forEach(enemy => {
                if (bullet.owner !== enemy && bullet.checkCollision(enemy)) {
                    enemy.takeDamage();
                    bullet.destroy();
                }
            });
        });
    }

    cleanup() {
        // 清理已销毁的对象
        this.bullets = this.bullets.filter(bullet => !bullet.isDestroyed);
        this.enemies = this.enemies.filter(enemy => enemy.parent);
    }

    checkGameState() {
        // 检查关卡是否完成
        if (this.enemiesSpawned >= this.levelData.totalEnemies && this.enemies.length === 0) {
            this.nextLevel();
        }
    }

    gameOver() {
        this.isGameOver = true;
        console.log('游戏结束！');
    }

    nextLevel() {
        this.level++;
        this.startLevel();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    restart() {
        this.level = 1;
        this.lives = 3;
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.startLevel();
    }

    createGameObjects() {
        // 游戏对象已在startLevel中创建
    }

    destroy() {
        if (this.tankApp.pixi) {
            this.tankApp.pixi.destroy(true);
        }
        
        window.removeEventListener('keydown', this.setupInput);
        window.removeEventListener('keyup', this.setupInput);
    }
} 