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
import TankGameLogic from './TankGameLogic.js';

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
        this.logic = new TankGameLogic(this);
        this.on('removed', this.makeDead, this);
        this.startLevel();
        this.side.updateView();
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

        this.side = new TankGameSide(this);
        this.addChild(this.side);
        this.side.position.set(MapWidth/2+50, 0);
    }
    
    update(deltaTime) {
        this.logic.update(deltaTime);
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
    
    getMovableDistance(bounds, direction, excludeTank = null) {
        return this.logic.getMovableDistance(bounds, direction, excludeTank);
    }

    isInBounds(x, y) {
        return this.logic.isInBounds(x, y);
    }

    onTankDeadFinish(tank) {
        this.logic.onTankDeadFinish(tank);
    }

    onHomeDeadFinish(home) {
        this.logic.onHomeDeadFinish(home);
    }

    onBulletDeadFinish(bullet) {
        this.logic.onBulletDeadFinish(bullet);
    }

    makeDead(){
        this.input.makeDead();
        if (this.logic && this.logic.makeDead) {
            this.logic.makeDead();
        }
    }
}