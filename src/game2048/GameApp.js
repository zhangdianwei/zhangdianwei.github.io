import * as PIXI from 'pixi.js';

// 层级枚举
export const GameLayer = {
    BgLayer: 0,
    LooseCube: 1,
    EnermySnake: 2,
    PlayerSnake: 3
};

export class GameApp {
    static _instance;

    // PIXI相关
    pixi = null;
    rootContainer = null;
    ticker = null;

    // 游戏对象全部通过分层容器统一管理
    radius = 300;

    // 分层容器（唯一游戏对象管理入口）
    _layerContainers = [null, null, null, null]; // [Bg, LooseCube, EnermySnake, PlayerSnake]

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
        this.rootContainer = new PIXI.Container();
        this._layerContainers = [
            new PIXI.Container(), // BgLayer
            new PIXI.Container(), // LooseCube层
            new PIXI.Container(), // EnermySnake层
            new PIXI.Container()  // PlayerSnake层
        ];
        this._layerContainers.forEach(layer => this.rootContainer.addChild(layer));
        this.pixi.stage.addChild(this.rootContainer);
        this.rootContainer.position.set(this.pixi.screen.width / 2, this.pixi.screen.height / 2);
        this.radius = this.pixi.screen.width / 2;
        this._inited = true;
    }

    get bgCircle(){
        return this._layerContainers[GameLayer.BgLayer].children[0];
    }

    get playerSnake() {
        return this._layerContainers[GameLayer.PlayerSnake].children[0];
    }

    get enemySnakes() {
        return this._layerContainers[GameLayer.EnermySnake].children;
    }

    get looseCubes() {
        return this._layerContainers[GameLayer.LooseCube].children;
    }

    destroy() {
        if (!this._inited) return;
        if (this.ticker) this.ticker.stop();
        if (this.pixi) {
            this.pixi.destroy(true, { children: true, texture: true, baseTexture: true });
        }
        this.rootContainer = null;
        this._layerContainers = [null, null, null, null];
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

    restart() {
        this.destroy();
        // 需要外部重新调用init
    }




    getLayerContainer(layer) {
        return this._layerContainers[layer];
    }

    clearAllGameObjects() {
        this._layerContainers.forEach(layer => {
            if (layer) layer.removeChildren();
        });
    }

    addGameObject(obj, layer) {
        if (this._layerContainers[layer]) {
            this._layerContainers[layer].addChild(obj);
            if (obj.onAdd) {
                obj.onAdd();
            }
        }
    }

    removeGameObject(obj) {
        this._layerContainers.forEach(layer => {
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
}
