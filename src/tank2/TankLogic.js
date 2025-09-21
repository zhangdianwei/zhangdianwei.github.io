import * as PIXI from 'pixi.js';
import { createPixi, initDom } from '../pixi/PixiHelper.js';
import { TankApp } from './TankApp.js';
import TankLevelData from './TankLevelData.js';
import TankCompInput from './TankCompInput.js';
import EnemySpawner from './EnemySpawner.js';
import TankEnemy from './TankEnemy.js';
import Bullet from './Bullet.js';
import { TileType, MapWidth, MapHeight } from './TileType.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import TankBase from './TankBase.js';
import Ticker from './Ticker.js';
import TankStartUI from './TankStartUI.js';
import TankGameUI from './TankGameUI.js';

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

        this.tankApp.uiContainer = new PIXI.Container();
        this.tankApp.gameContainer.addChild(this.tankApp.uiContainer);
        this.tankApp.uiContainer.position.set(this.tankApp.pixi.screen.width / 2, this.tankApp.pixi.screen.height / 2);

        this.tankApp.ticker = new Ticker();
        this._gameTickId = this.tankApp.ticker.tick((dt) => this.update(dt), 0);

        // this.tankApp.setUI(new TankStartUI());
        this.tankApp.setUI(new TankGameUI());

        // this.createRenderLayers();

        // this.inputManager = new InputManager();
        // this.inputManager.setupInput();

        // this.enemySpawner = new EnemySpawner();

        // this.tankApp.levelData = new TankLevelData();
        
        // 启动游戏循环
        
        
        // this.tankApp.levelData.loadLevel(0);
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
        
        // 更新玩家子弹
        this.tankApp.playerBullets.forEach(bullet => {
            bullet.update(deltaTime);
        });
        
        // 更新敌人子弹
        this.tankApp.enemyBullets.forEach(bullet => {
            bullet.update(deltaTime);
        });
    }

    resetGameObjects() {
        this.tankApp.player = null;
        this.tankApp.enemies = [];
        this.tankApp.playerBullets = [];
        this.tankApp.enemyBullets = [];
    }

    update(dt) {

        if(this.tankApp.ui && this.tankApp.ui.update){
            this.tankApp.ui.update(dt);
        }

        // if (this.isPaused || this.isGameOver) return;
        
        // 更新玩家输入
        // this.inputManager.update(dt);
        
        // 更新游戏对象
        // this.updateGameObjects(dt);
        
        // 更新敌人生成
        // if (this.enemySpawner) {
        //     this.enemySpawner.update(dt);
        // }
        
        // 更新关卡数据
        // this.tankApp.levelData.updateEffects(dt);
        
        // 碰撞检测
        // this.checkCollisions();
        
        // 检查游戏状态
        // this.checkGameState();
    }

    checkCollisions() {
        const playerBullets = this.tankApp.playerBullets.concat();
        const enemyBullets = this.tankApp.enemyBullets.concat();
        const allBullets = [...playerBullets, ...enemyBullets];
        const player = this.tankApp.player;
        const enemies = this.tankApp.enemies;
        
        // 子弹与地图碰撞
        for (let i = 0; i < allBullets.length; i++) {
            const bullet = allBullets[i];
            this.tankApp.levelData.checkCollisionBullet(bullet);
        }
        
        // 玩家子弹与敌人碰撞
        playerBullets.forEach(bullet => {
            enemies.forEach(enemy => {
                if (this.checkBulletTankCollision(bullet, enemy)) {
                    enemy.takeDamage(bullet.power);
                    bullet.destroy();
                }
            });
        });
        
        // 敌人子弹与玩家碰撞
        enemyBullets.forEach(bullet => {
            if (player && this.checkBulletTankCollision(bullet, player)) {
                player.takeDamage(bullet.power);
                bullet.destroy();
            }
        });
        
        // 玩家子弹与敌人子弹碰撞
        playerBullets.forEach(playerBullet => {
            enemyBullets.forEach(enemyBullet => {
                if (this.checkBulletBulletCollision(playerBullet, enemyBullet)) {
                    playerBullet.destroy();
                    enemyBullet.destroy();
                }
            });
        });
    }

    checkBulletTankCollision(bullet, tank) {
        if (!bullet || !tank) return false;
        
        const bulletBounds = bullet.getBounds();
        const tankBounds = tank.getBounds();
        
        // AABB碰撞检测
        return bulletBounds.x < tankBounds.x + tankBounds.width &&
               bulletBounds.x + bulletBounds.width > tankBounds.x &&
               bulletBounds.y < tankBounds.y + tankBounds.height &&
               bulletBounds.y + bulletBounds.height > tankBounds.y;
    }

    checkBulletBulletCollision(bullet1, bullet2) {
        if (!bullet1 || !bullet2) return false;
        
        const bullet1Bounds = bullet1.getBounds();
        const bullet2Bounds = bullet2.getBounds();
        
        // AABB碰撞检测
        return bullet1Bounds.x < bullet2Bounds.x + bullet2Bounds.width &&
               bullet1Bounds.x + bullet1Bounds.width > bullet2Bounds.x &&
               bullet1Bounds.y < bullet2Bounds.y + bullet2Bounds.height &&
               bullet1Bounds.y + bullet1Bounds.height > bullet2Bounds.y;
    }

    // 检查坦克与坦克的碰撞
    checkTankTankCollision(tank1, tank2) {
        if (!tank1 || !tank2 || tank1 === tank2) return false;
        
        const tank1Bounds = tank1.getBounds();
        const tank2Bounds = tank2.getBounds();
        
        // AABB碰撞检测
        return tank1Bounds.x < tank2Bounds.x + tank2Bounds.width &&
               tank1Bounds.x + tank1Bounds.width > tank2Bounds.x &&
               tank1Bounds.y < tank2Bounds.y + tank2Bounds.height &&
               tank1Bounds.y + tank1Bounds.height > tank2Bounds.y;
    }

    // 获取坦克的可移动距离，只考虑坦克碰撞
    getMovableDistance(bounds, direction, excludeTank = null) {
        const centerX = bounds.x;
        const centerY = bounds.y;
        const width = bounds.width;
        const height = bounds.height;
        
        // 获取所有坦克（排除指定的坦克）
        const allTanks = [this.tankApp.player, ...this.tankApp.enemies].filter(t => t && t !== excludeTank);
        
        let minDistance = Infinity;
        
        // 遍历所有坦克，找到在指定方向上最近的碰撞距离
        for (const tank of allTanks) {
            const tankBounds = tank.getBounds();
            const tankCenterX = tankBounds.x;
            const tankCenterY = tankBounds.y;
            const tankWidth = tankBounds.width;
            const tankHeight = tankBounds.height;
            
            let distance = Infinity;
            
            // 根据方向计算距离
            if (direction === 0) { // UP
                // 检查上方是否有坦克
                if (centerX - width/2 < tankCenterX + tankWidth/2 && 
                    centerX + width/2 > tankCenterX - tankWidth/2) {
                    // X轴有重叠，计算Y轴距离
                    distance = centerY - height/2 - (tankCenterY + tankHeight/2);
                }
            } else if (direction === 1) { // RIGHT
                // 检查右方是否有坦克
                if (centerY - height/2 < tankCenterY + tankHeight/2 && 
                    centerY + height/2 > tankCenterY - tankHeight/2) {
                    // Y轴有重叠，计算X轴距离
                    distance = tankCenterX - tankWidth/2 - (centerX + width/2);
                }
            } else if (direction === 2) { // DOWN
                // 检查下方是否有坦克
                if (centerX - width/2 < tankCenterX + tankWidth/2 && 
                    centerX + width/2 > tankCenterX - tankWidth/2) {
                    // X轴有重叠，计算Y轴距离
                    distance = tankCenterY - tankHeight/2 - (centerY + height/2);
                }
            } else if (direction === 3) { // LEFT
                // 检查左方是否有坦克
                if (centerY - height/2 < tankCenterY + tankHeight/2 && 
                    centerY + height/2 > tankCenterY - tankHeight/2) {
                    // Y轴有重叠，计算X轴距离
                    distance = centerX - width/2 - (tankCenterX + tankWidth/2);
                }
            }
            
            // 更新最小距离
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
        
        // 如果没有找到碰撞，返回一个很大的值
        if (minDistance === Infinity) {
            return 1000;
        }
        
        // 如果距离是负数（坦克在后面），但超过一个坦克的距离，则允许移动
        if (minDistance < 0 && Math.abs(minDistance) > Math.max(width, height)) {
            return 1000; // 返回一个很大的值，允许移动
        }
        
        return minDistance;
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