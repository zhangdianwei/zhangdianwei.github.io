import * as PIXI from 'pixi.js';
import { TankApp } from './TankApp.js';
import TankBase from './TankBase.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import { TileType, Dir, TileSize, TankType, MapWidth, MapHeight } from './TileType.js';
import TankCompInput from './TankCompInput.js';
import TankCompMap from './TankCompMap.js';

export default class TankGameUI extends PIXI.Container {
    constructor() {
        super();
        
        this.tankApp = TankApp.instance;
        this.textures = this.tankApp.textures;
        
        // === 从TankApp整合的游戏对象管理 ===
        this.player = null;
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        
        // === 从TankLevelData整合的关卡数据 ===
        this.levelId = 0;
        this.lives = 3;
        this.score = 0;
        
        // === 游戏对象 ===
        this.home = null;
        
        // === 组件管理 ===
        this.input = null;
        this.map = null;
        
        // === 根容器 ===
        this.root = new PIXI.Container();
        this.addChild(this.root);
        this.root.position.set(-MapWidth/2, -MapHeight/2);
        
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

        this.startLevel();
    }
    
    createRenderLayers() {
        // 按照渲染层级创建容器
        this.renderLayers.background = new PIXI.Container(); // RenderLayer1: 空地背景
        this.renderLayers.tiles = new PIXI.Container();      // RenderLayer2: 砖块、铁块、水面等小方块
        this.renderLayers.tank = new PIXI.Container();       // RenderLayer3: 坦克层（玩家、敌人、基地）
        this.renderLayers.bullets = new PIXI.Container();    // RenderLayer4: 子弹层
        this.renderLayers.grass = new PIXI.Container();      // RenderLayer5: 草地（装饰层）
        this.renderLayers.effect = new PIXI.Container();     // RenderLayer6: 效果层
        
        this.root.addChild(this.renderLayers.background);
        this.root.addChild(this.renderLayers.tiles);
        this.root.addChild(this.renderLayers.tank);
        this.root.addChild(this.renderLayers.bullets);
        this.root.addChild(this.renderLayers.grass);
        this.root.addChild(this.renderLayers.effect);
    }
    
    initComps() {
        this.input = new TankCompInput();
        this.input.setupInput();
        
        this.map = new TankCompMap(this);
        this.map.setRenderLayers(this.renderLayers);
    }
    
    update(deltaTime) {
        // 更新输入管理器
        if (this.input) {
            this.input.update(deltaTime);
        }
        
        // 更新地图组件
        if (this.map) {
            this.map.update(deltaTime);
        }
    }
    
    // === 从TankApp整合的游戏对象管理方法 ===
    
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
    
    addEffect(effectName, x, y, callback) {
        const effect = createSpriteSeqAnim(effectName, callback);
        effect.x = x;
        effect.y = y;
        this.renderLayers.effect.addChild(effect);
    }
    
    // === 地图组件代理方法 ===
    
    startLevel() {
        if (this.map) {
            this.map.startLevel();
        }
    }
    
    loadLevel(levelId) {
        if (this.map) {
            return this.map.loadLevel(levelId);
        }
        return false;
    }
    
    setLevel(levelId) {
        if (this.map) {
            this.map.setLevel(levelId);
        }
    }
    
    nextLevel() {
        if (this.map) {
            this.map.nextLevel();
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
        
        // 创建基地（使用一张2x2的大图）
        this.home = PIXI.Sprite.from('tank2/bigtile_6.png');
        this.home.width = TileSize * 2;
        this.home.height = TileSize * 2;
        this.home.anchor.set(0, 0);
        
        // 设置位置（左上角对齐到第一个tile位置）
        this.home.x = homeCol * TileSize;
        this.home.y = (homeRow - 1) * TileSize;
        
        // 添加到tank渲染层
        this.renderLayers.tank.addChild(this.home);
    }
    
    clearAll() {
        if (this.map) {
            this.map.clearAll();
        }
    }
    
    reset() {
        if (this.map) {
            this.map.reset();
        }
    }
    
    destroy() {
        this.clearAll();
        this.removeChildren();
        super.destroy();
    }
}