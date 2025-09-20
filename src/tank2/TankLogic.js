import * as PIXI from 'pixi.js';
import { createPixi, initDom } from '../pixi/PixiHelper.js';
import { TankApp } from './TankApp.js';
import TankLevelData from './TankLevelData.js';
import InputManager from './InputManager.js';
import EnemySpawner from './EnemySpawner.js';
import TankEnemy from './TankEnemy.js';
import Bullet from './Bullet.js';
import { TileType, MapWidth, MapHeight } from './TileType.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import TankBase from './TankBase.js';
import Ticker from './Ticker.js';

export class TankLogic {
    constructor() {
        this.tankApp = TankApp.instance;
        
        // 游戏状态
        this.isPaused = false;
        this.isGameOver = false;
        
        // 管理器
        this.levelData = null;
        this.inputManager = null;
        this.enemySpawner = null;
    }

    init(domElement) {
        // 初始化DOM尺寸
        initDom(domElement, {
            designWidth: 1920,
            designHeight: 1080,
            isFullScreen: false
        });
        
        this.tankApp.pixi = createPixi(domElement);
        this.tankApp.gameContainer = new PIXI.Container();
        this.tankApp.pixi.stage.addChild(this.tankApp.gameContainer);

        // 创建渲染层
        this.createRenderLayers();

        // 创建管理器
        this.inputManager = new InputManager();
        this.inputManager.setupInput();

        this.enemySpawner = new EnemySpawner();

        this.tankApp.levelData = new TankLevelData();
        
        this.tankApp.ticker = new Ticker();
        this._gameTickId = this.tankApp.ticker.tick((dt) => this.update(dt), 0);
        
        // 开始游戏
        this.tankApp.levelData.loadLevel(0);
    }

    addBullet(bullet) {
        this.tankApp.bullets.push(bullet);
        this.tankApp.renderLayers.bullets.addChild(bullet);
    }
    
    removeBullet(bullet) {
        this.tankApp.renderLayers.bullets.removeChild(bullet);
        let index = this.tankApp.bullets.indexOf(bullet);
        if (index === -1) return;
        this.tankApp.bullets.splice(index, 1);
    }

    addEnemy(enemy) {
        this.tankApp.enemies.push(enemy);
        this.tankApp.renderLayers.tank.addChild(enemy);
    }

    removeEnemy(enemy) {
        this.tankApp.renderLayers.tank.removeChild(enemy);
        let index = this.tankApp.enemies.indexOf(enemy);
        if (index === -1) return;
        this.tankApp.enemies.splice(index, 1);
    }

    addEffect(effectName, x, y, callback) {
        const effect = createSpriteSeqAnim(effectName, callback);
        effect.x = x;
        effect.y = y;
        this.tankApp.renderLayers.effect.addChild(effect);
    }

    updateGameObjects(deltaTime) {
        // 更新玩家
        if (this.tankApp.player) {
            this.tankApp.player.update(deltaTime);
        }
        
        // 更新敌人
        this.tankApp.enemies.forEach(enemy => {
            enemy.update(deltaTime);
        });
        
        // 更新子弹
        this.tankApp.bullets.forEach(bullet => {
            bullet.update(deltaTime);
        });
    }

    resetGameObjects() {
        this.tankApp.player = null;
        this.tankApp.enemies = [];
        this.tankApp.bullets = [];
    }

    update(dt) {

        if (this.isPaused || this.isGameOver) return;
        
        // 更新玩家输入
        // this.inputManager.update(dt);
        
        // 更新游戏对象
        this.updateGameObjects(dt);
        
        // 更新敌人生成
        this.enemySpawner.update(dt);
        
        // 更新关卡数据
        // this.tankApp.levelData.updateEffects(dt);
        
        // 碰撞检测
        this.checkCollisions();
        
        // 检查游戏状态
        // this.checkGameState();
    }

    checkCollisions() {
        const bullets = this.tankApp.bullets.concat();
        const player = this.tankApp.player;
        const enemies = this.tankApp.enemies;
        
        // 子弹与地图碰撞
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            this.tankApp.levelData.checkCollisionBullet(bullet);
        }
        
        // 子弹与坦克碰撞
        bullets.forEach(bullet => {
            // 检查子弹与玩家碰撞
            if (player && bullet.owner !== player && this.checkBulletTankCollision(bullet, player)) {
                player.takeDamage(bullet.power);
                bullet.destroy();
            }

            // 检查子弹与敌人碰撞
            enemies.forEach(enemy => {
                if (bullet.owner !== enemy && this.checkBulletTankCollision(bullet, enemy)) {
                    enemy.takeDamage(bullet.power);
                    bullet.destroy();
                }
            });
        });
    }

    checkBulletTankCollision(bullet, tank) {
        if (!bullet || !tank) return false;
        
        const bulletBounds = bullet.getBounds();
        const tankBounds = {
            x: tank.x - tank.size / 2,
            y: tank.y - tank.size / 2,
            width: tank.size,
            height: tank.size
        };
        
        // AABB碰撞检测
        return bulletBounds.x < tankBounds.x + tankBounds.width &&
               bulletBounds.x + bulletBounds.width > tankBounds.x &&
               bulletBounds.y < tankBounds.y + tankBounds.height &&
               bulletBounds.y + bulletBounds.height > tankBounds.y;
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

    startLevel(){
        
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
        if (this.tankApp.ticker) {
            this.tankApp.ticker.stop();
            this.tankApp.ticker = null;
        }
        if (this.tankApp.pixi) {
            this.tankApp.pixi.destroy(true);
            this.tankApp.pixi = null;
        }
        this.inputManager.destroy();
    }

    createRenderLayers() {
        // 按照新的渲染层级
        this.tankApp.renderLayers.background = new PIXI.Container(); // RenderLayer1: 空地背景
        this.tankApp.renderLayers.tiles = new PIXI.Container();      // RenderLayer2: 砖块、铁块、水面等小方块
        this.tankApp.renderLayers.tank = new PIXI.Container();       // RenderLayer3: 坦克层（玩家、敌人、基地）
        this.tankApp.renderLayers.bullets = new PIXI.Container();    // RenderLayer4: 子弹层
        this.tankApp.renderLayers.grass = new PIXI.Container();      // RenderLayer5: 草地（装饰层）
        this.tankApp.renderLayers.effect = new PIXI.Container();     // RenderLayer6: 效果层
        
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.background);
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.tiles);
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.tank);
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.bullets);
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.grass);
        this.tankApp.gameContainer.addChild(this.tankApp.renderLayers.effect);

        // {
        //     this.tankApp.renderLayers.background.alpha = 0.1;
        //     this.tankApp.renderLayers.tiles.alpha = 0.1;
        //     this.tankApp.renderLayers.tank.alpha = 0.1;
        //     this.tankApp.renderLayers.bullets.alpha = 0.1;
        //     this.tankApp.renderLayers.grass.alpha = 0.1;
        // }
    }

    isInBounds(x, y) {
        return x >= 0 && x < MapWidth && y >= 0 && y < MapHeight;
    }
} 