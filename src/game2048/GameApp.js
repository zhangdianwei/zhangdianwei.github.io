import * as PIXI from 'pixi.js';
import { createPixi } from '../pixi/PixiHelper';
import * as TWEEN from '@tweenjs/tween.js';

// 层级枚举
export const GameLayer = {
    BgLayer: 0,
    LooseCube: 1,
    EnermySnake: 2,
    PlayerSnake: 3,
};

export class GameApp {
    static _instance;

    // PIXI相关
    pixi = null;
    gameContainer = null;
    uiContainer = null;
    ticker = null;

    // 游戏对象全部通过分层容器统一管理
    radius = 1920;
    gameState = null; // 'init' | 'playing' | 'fail'

    // 恶搞型中文名字池
    chineseFunnyNames = [
        '蛇皮怪', '打工魂', '摸鱼王', '卷王者', '菜鸡王', '蛇神君', '快乐蛇', '小憨憨',
        '蛇皮王', '野区王', '天命蛇', '混子哥', '高冷蛇', '咸鱼王', '天胡王', '蛇界白',
        '操作王', '嘴强王', '蛇皮龙', '小白龙', '扛把子', '操作龙', '浪里蛇', '蛇皮侠',
        '小霸王', '一键蛇', '三连王', '蛇皮魂', '蛇皮哥', '蛇皮仔', '蛇皮弟', '蛇皮妹',
        '蛇皮叔', '蛇皮姐', '蛇皮王', '蛇皮神', '蛇皮皇', '蛇皮帝', '蛇皮圣',
        '蛇皮星', '蛇皮尊', '蛇皮宗', '蛇皮宗师', '蛇皮宗主', '蛇皮尊者', '蛇皮大帝',
        '蛇皮天尊', '蛇皮至尊', '蛇皮老祖', '蛇皮祖师', '蛇皮宗长', '蛇皮宗伯',
        '蛇皮元老', '蛇皮元帅', '蛇皮元君', '蛇皮元王', '蛇皮元宗', '蛇皮元尊',
        '蛇皮元宗师', '蛇皮元宗主', '蛇皮元尊者', '蛇皮元大帝', '蛇皮元天尊',
        '蛇皮元至尊', '蛇皮元老祖', '蛇皮元祖师', '蛇皮元宗长', '蛇皮元宗伯',
        '蛇皮元元老', '蛇皮元元帅', '蛇皮元元君', '蛇皮元元王', '蛇皮元元宗',
        '蛇皮元元尊', '蛇皮元元宗师', '蛇皮元元宗主', '蛇皮元元尊者', '蛇皮元元大帝',
        '蛇皮元元天尊', '蛇皮元元至尊', '蛇皮元元老祖', '蛇皮元元祖师', '蛇皮元元宗长',
        '蛇皮元元宗伯'
    ];
    randomName(){
        const name = this.chineseFunnyNames[Math.floor(Math.random() * this.chineseFunnyNames.length)];
        return name;
    }

    rankList = [];
    playerRank = {name: 'YOU', value: 0}

    updateRankList(name, value) {
        const idx = this.rankList.findIndex(item => item.name === name);
        if (idx !== -1) {
            this.rankList[idx].value = value;
        } else {
            this.rankList.push({ name, value });
        }
        this.rankList.sort((a, b) => b.value - a.value);
        this.rankList = this.rankList.slice(0, 5);
    }

    // 分层容器（游戏对象管理）
    layerContainers = [null, null, null, null]; // [Bg, LooseCube, EnermySnake, PlayerSnake]

    // 状态
    _inited = false;

    constructor() {}

    static get instance() {
        if (!GameApp._instance) {
            GameApp._instance = new GameApp();
        }
        return GameApp._instance;
    }

    /**
     * 初始化游戏主控（PIXI、场景、对象等）
     * @param {HTMLElement} domElement - PIXI挂载点
     * @param {Object} options - 游戏配置参数
     */
    init(domElement) {
        if (this._inited) return;
        // 创建PIXI app
        this.pixi = createPixi(domElement);
        this.ticker = this.pixi.ticker;
        
        // 游戏容器
        this.gameContainer = new PIXI.Container();
        this.layerContainers = [
            new PIXI.Container(), // BgLayer
            new PIXI.Container(), // LooseCube层
            new PIXI.Container(), // EnermySnake层
            new PIXI.Container(), // PlayerSnake层
        ];
        this.layerContainers.forEach(layer => this.gameContainer.addChild(layer));
        this.pixi.stage.addChild(this.gameContainer);
        this.gameContainer.position.set(this.pixi.screen.width / 2, this.pixi.screen.height / 2);

        // UI容器（独立管理）
        this.uiContainer = new PIXI.Container();
        this.pixi.stage.addChild(this.uiContainer);
        this.uiContainer.position.set(this.pixi.screen.width / 2, this.pixi.screen.height / 2);

        this.ticker.add(this.update, this);

        this._inited = true;
    }

    update(delta){
        TWEEN.update(delta);
    }

    get bgCircle(){
        return this.layerContainers[GameLayer.BgLayer].children[0];
    }

    get playerSnake() {
        return this.layerContainers[GameLayer.PlayerSnake].children[0];
    }

    get enemySnakes() {
        return this.layerContainers[GameLayer.EnermySnake].children;
    }

    get looseCubes() {
        return this.layerContainers[GameLayer.LooseCube].children;
    }

    destroy() {
        if (!this._inited) return;
        if (this.ticker) this.ticker.stop();
        if (this.pixi) {
            this.pixi.destroy(true, { children: true, texture: true, baseTexture: true });
        }
        this.gameContainer = null;
        this.uiContainer = null;
        this.layerContainers = [null, null, null, null];
        this.pixi = null;
        this.ticker = null;
        this._inited = false;
    }

    getLayerContainer(layer) {
        return this.layerContainers[layer];
    }

    clearAllGameObjects() {
        this.layerContainers.slice(1).forEach(layer => {
            if (layer) layer.removeChildren();
        });
    }

    addGameObject(obj, layer) {
        if (this.layerContainers[layer]) {
            this.layerContainers[layer].addChild(obj);
            if (obj.onAdd) {
                obj.onAdd();
            }
        }
    }

    removeGameObject(obj) {
        this.layerContainers.forEach(layer => {
            if (obj.parent === layer) {
                layer.removeChild(obj);
                if (obj.onDestroy) {
                    obj.onDestroy();
                }
            }
        });
    }

    setObjectLayer(obj, layer) {
        this.removeGameObject(obj);
        this.addGameObject(obj, layer);
    }

    // UI管理方法
    addUI(uiElement) {
        if (this.uiContainer) {
            this.uiContainer.addChild(uiElement);
            if (uiElement.onAdd) {
                uiElement.onAdd();
            }
        }
    }

    removeUI(uiElement) {
        if (this.uiContainer && uiElement.parent === this.uiContainer) {
            this.uiContainer.removeChild(uiElement);
            if (uiElement.onDestroy) {
                uiElement.onDestroy();
            }
        }
    }

    clearUI() {
        if (this.uiContainer) {
            this.uiContainer.removeChildren();
        }
    }
}
