import * as PIXI from 'pixi.js';

// 层级枚举
export const GameLayer = {
    BgLayer: 0,
    LooseCube: 1,
    EnermySnake: 2,
    PlayerSnake: 3,
};

export const UIName = {
    StartScreen: 'start-screen',
    FailScreen: 'fail-screen',
}

export class GameApp {
    static _instance;

    // PIXI相关
    pixi = null;
    gameContainer = null;
    ticker = null;
    uiContainer = null;

    // 游戏对象全部通过分层容器统一管理
    radius = 300;

    // 分层容器（唯一游戏对象管理入口）
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
    init(domElement, options = {}) {
        if (this._inited) return;
        // 创建PIXI app
        this.pixi = new PIXI.Application({
            width: options.width || window.innerWidth,
            height: options.height || window.innerHeight,
            // backgroundAlpha: 0,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
        domElement.appendChild(this.pixi.view);
        this.ticker = this.pixi.ticker;
        // 分层容器
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
        this.radius = this.pixi.screen.width / 2;

        this.uiContainer = new PIXI.Container();
        this.pixi.stage.addChild(this.uiContainer);
        this.uiContainer.position.set(this.pixi.screen.width / 2, this.pixi.screen.height / 2);

        this._inited = true;
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
        this.layerContainers = [null, null, null, null];
        this.pixi = null;
        this.ticker = null;
        this._inited = false;
        this._paused = false;
    }

    resize(width, height) {
        if (this.pixi) {
            this.pixi.renderer.resize(width, height);
        }
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

    showUILayer(node, name){
        node.name = name;
        this.uiContainer.addChild(node);
    }
    removeUILayer(name){
        this.uiContainer.removeChild(this.uiContainer.children.find(node => node.name === name));
    }
}
