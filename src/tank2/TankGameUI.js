import * as PIXI from 'pixi.js';
import { TankApp } from './TankApp.js';
import TankBase from './TankBase.js';
import TankHome from './TankHome.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import { TileType, Dir, TileSize, TankType, MapWidth, MapHeight } from './TileType.js';
import TankCompInput from './TankCompInput.js';
import TankCompMap from './TankCompMap.js';
import TankCompEnemySpawner from './TankCompEnemySpawner.js';
import TankGameSide from './TankGameSide.js';

export default class TankGameUI extends PIXI.Container {
    constructor() {
        super();
        
        this.tankApp = TankApp.instance;
        this.textures = this.tankApp.textures;
        
        // === 根容器 ===
        this.tileRoot = new PIXI.Container();
        this.addChild(this.tileRoot);
        this.tileRoot.position.set(-MapWidth/2, -MapHeight/2);
        this.createMapBorder();

        // === 组件管理 ===
        this.input = null;
        this.map = null;
        this.enemySpawner = null;
        
        // === 渲染层管理 ===
        this.renderLayers = {
            background: null,
            tiles: null,
            tank: null,
            bullets: null,
            grass: null,
            effect: null
        };
        this.createRenderLayers();
        this.initComps();
        this.on('removed', this.makeDead, this);
        this.startLevel();
    }

    onAppearFinish(){
        this.createPlayer();
    }
    
    createMapBorder() {
        // 创建地图边框
        const border = new PIXI.Graphics();
        
        // 绘制圆角矩形边框
        border.lineStyle(3, 0xFFFFFF, 0.5); // 白色边框，3像素宽
        border.drawRoundedRect(-MapWidth/2, -MapHeight/2, MapWidth, MapHeight, 8);
        
        // 添加到tileRoot的父容器（与tileRoot同级）
        this.addChild(border);
    }
    
    createRenderLayers() {
        // 按照渲染层级创建容器
        this.renderLayers.background = new PIXI.Container(); // RenderLayer1: 空地背景
        this.renderLayers.tiles = new PIXI.Container();      // RenderLayer2: 砖块、铁块、水面等小方块
        this.renderLayers.tank = new PIXI.Container();       // RenderLayer3: 坦克层（玩家、敌人、基地）
        this.renderLayers.bullets = new PIXI.Container();    // RenderLayer4: 子弹层
        this.renderLayers.grass = new PIXI.Container();      // RenderLayer5: 草地（装饰层）
        this.renderLayers.effect = new PIXI.Container();     // RenderLayer6: 效果层
        
        this.tileRoot.addChild(this.renderLayers.background);
        this.tileRoot.addChild(this.renderLayers.tiles);
        this.tileRoot.addChild(this.renderLayers.tank);
        this.tileRoot.addChild(this.renderLayers.bullets);
        this.tileRoot.addChild(this.renderLayers.grass);
        this.tileRoot.addChild(this.renderLayers.effect);
    }
    
    initComps() {
        this.updater = [];

        this.map = new TankCompMap(this);
        this.map.setRenderLayers(this.renderLayers);
        
        this.input = new TankCompInput(this);
        
        this.enemySpawner = new TankCompEnemySpawner(this);
        this.updater.push(this.enemySpawner);

        this.side = new TankGameSide();
        this.addChild(this.side);
        this.side.position.set(MapWidth/2+50, 0);
    }
    
    update(deltaTime) {
        if (this.tankApp.playerData.levelEndType != 0)
            return;

        this.updater.forEach(updater => {
            updater.update(deltaTime);
        });
        
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        // 更新敌人
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
        });
        
        // 更新玩家子弹
        this.playerBullets.forEach(bullet => {
            bullet.update(deltaTime);
        });
        
        // 更新敌人子弹
        this.enemyBullets.forEach(bullet => {
            bullet.update(deltaTime);
        });
        
        // 检查碰撞
        this.checkCollisions();
    }
    
    addBullet(bullet) {
        if (bullet.bulletType === 'player') {
            this.playerBullets.push(bullet);
        } else {
            this.enemyBullets.push(bullet);
        }
        this.renderLayers.bullets.addChild(bullet);
    }
    
    removeBullet(bullet) {
        this.renderLayers.bullets.removeChild(bullet);
        
        if (bullet.bulletType === 'player') {
            let index = this.playerBullets.indexOf(bullet);
            if (index !== -1) {
                this.playerBullets.splice(index, 1);
            }
        } else {
            let index = this.enemyBullets.indexOf(bullet);
            if (index !== -1) {
                this.enemyBullets.splice(index, 1);
            }
        }
    }
    
    addEnemy(enemy) {
        this.enemies.push(enemy);
        this.renderLayers.tank.addChild(enemy);
    }
    
    removeEnemy(enemy) {
        this.renderLayers.tank.removeChild(enemy);
        let index = this.enemies.indexOf(enemy);
        if (index === -1) return;
        this.enemies.splice(index, 1);
    }

    addPlayer(player) {
        this.player = player;
        this.renderLayers.tank.addChild(player);
    }

    removePlayer(player) {
        this.renderLayers.tank.removeChild(player);
        this.player = null;
    }

    addEffect(effectName, x, y, callback) {
        const effect = createSpriteSeqAnim(effectName, callback);
        effect.x = x;
        effect.y = y;
        this.renderLayers.effect.addChild(effect);
    }
    
    startLevel() {
        this.clearLevel();
        this.map.loadLevel(this.tankApp.playerData.levelId);
        this.createHome();
    }
    
    nextLevel() {
        this.tankApp.playerData.levelId++;
        this.startLevel();
    }

    clearLevel() {
        this.home = null;
        this.player = null;
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];

        for(let name in this.renderLayers){
            if(this.renderLayers[name]){
                this.renderLayers[name].removeChildren();
            }
        }
    }
    
    createPlayer() {
        // 清除现有玩家
        if (this.player) {
            if (this.player.parent) {
                this.player.parent.removeChild(this.player);
            }
        }
        
        this.player = new TankBase(TankType.PLAYER);
        this.renderLayers.tank.addChild(this.player);
        
        // 设置玩家初始位置（基地左边3个格子）
        const baseRow = this.map.mapRows - 1;
        const baseCol = this.map.mapCols / 2 - 1;
        let playerRow = baseRow;
        let playerCol = baseCol - 2;
        this.player.x = playerCol * TileSize;
        this.player.y = playerRow * TileSize;

        this.player.appear();
    }
    
    createHome() {
        // 清除现有基地
        if (this.home) {
            if (this.home.parent) {
                this.home.parent.removeChild(this.home);
            }
        }
        
        // 基地固定创建在最下面一行的中心
        const homeRow = this.map.mapRows - 1;
        const homeCol = this.map.mapCols / 2 - 1;
        
        // 创建基地
        this.home = new TankHome();
        
        // 设置位置（中心对齐）
        this.home.x = homeCol * TileSize + TileSize;
        this.home.y = (homeRow - 1) * TileSize + TileSize;
        
        // 添加到tank渲染层
        this.renderLayers.tank.addChild(this.home);
    }
    
    // 检查所有碰撞
    checkCollisions() {
        const playerBullets = this.playerBullets.concat();
        const enemyBullets = this.enemyBullets.concat();
        const allBullets = [...playerBullets, ...enemyBullets];
        const player = this.player;
        const enemies = this.enemies;
        
        // 子弹与地图碰撞
        for (let i = 0; i < allBullets.length; i++) {
            const bullet = allBullets[i];
            this.map.checkCollisionBullet(bullet);
        }
        
        // 子弹与基地碰撞
        if (this.home && !this.home.isDead) {
            for (let i = 0; i < allBullets.length; i++) {
                const bullet = allBullets[i];
                if (this.home.checkCollision(bullet.x, bullet.y)) {
                    this.home.takeDamage(bullet.power);
                    bullet.makeDead();
                }
            }
        }
        
        
        // 玩家子弹与敌人碰撞
        playerBullets.forEach(bullet => {
            enemies.forEach(enemy => {
                if (this.checkBulletTankCollision(bullet, enemy)) {
                    enemy.takeDamage(bullet.power);
                    bullet.makeDead();
                }
            });
        });
        
        // 敌人子弹与玩家碰撞
        enemyBullets.forEach(bullet => {
            if (player && this.checkBulletTankCollision(bullet, player)) {
                player.takeDamage(bullet.power);
                bullet.makeDead();
            }
        });
        
        // 玩家子弹与敌人子弹碰撞
        playerBullets.forEach(playerBullet => {
            enemyBullets.forEach(enemyBullet => {
                if (this.checkBulletBulletCollision(playerBullet, enemyBullet)) {
                    playerBullet.makeDead();
                    enemyBullet.makeDead();
                }
            });
        });
    }
    
    // 检查子弹与坦克的碰撞
    checkBulletTankCollision(bullet, tank) {
        if (!bullet || !tank || bullet.isDead || tank.isDead) return false;
        
        const bulletBounds = bullet.getBounds();
        const tankBounds = tank.getBounds();
        
        // AABB碰撞检测
        return bulletBounds.x < tankBounds.x + tankBounds.width &&
               bulletBounds.x + bulletBounds.width > tankBounds.x &&
               bulletBounds.y < tankBounds.y + tankBounds.height &&
               bulletBounds.y + bulletBounds.height > tankBounds.y;
    }
    
    // 检查子弹与子弹的碰撞
    checkBulletBulletCollision(bullet1, bullet2) {
        if (!bullet1 || !bullet2 || bullet1.isDead || bullet2.isDead) return false;
        
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
        const allTanks = [this.player, ...this.enemies].filter(t => t && t !== excludeTank);
        
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
    
    // 检查位置是否在边界内
    isInBounds(x, y) {
        return x >= 0 && x < MapWidth && y >= 0 && y < MapHeight;
    }
    
    onTankDeadFinish(tank) {
        if(tank === this.player) {
            this.removePlayer(tank);
            this.checkCreatePlayer();
        }
        else {
            this.removeEnemy(tank);
        }
        this.checkGameState();
    }

    onHomeDeadFinish(home) {
        this.home = null;
        this.checkGameState();
    }

    onBulletDeadFinish(bullet) {
        this.removeBullet(bullet);
    }

    checkCreatePlayer() {
        if(this.tankApp.playerData.playerLives > 0) {
            this.tankApp.playerData.playerLives--;
            this.createPlayer();
        }
    }

    checkGameState(){
        if (this.tankApp.playerData.levelEndType != 0) return;

        do{
            if (this.enemySpawner.isFinished()) {
                this.tankApp.playerData.levelEndType = 1; // 胜利
                break;
            }
    
            if (!this.home) {
                this.tankApp.playerData.levelEndType = 2; // 失败
                break;
            }
    
            if (!this.player && this.tankApp.playerData.playerLives == 0) {
                this.tankApp.playerData.levelEndType = 2; // 失败
                break;
            }
        }
        while(0);

        if (this.tankApp.playerData.levelEndType){
            this.tankApp.ticker.tickOnce(()=>{
                this.tankApp.logic.setUI('TankEndUI');
            }, 2);
        }
    }

    makeDead(){
        this.input.makeDead();
    }
}