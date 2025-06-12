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
    gameState = null; // 'init' | 'playing' | 'fail'

    // 恶搞型中文名字池
    chineseFunnyNames = [
        '隔壁老王', '社会你强哥', '菜就多练', '蛇皮怪', '大聪明', '打工人', '摸鱼大师', '卷王之王',
        '小学生之光', '野区霸主', '天选打野', '快乐风男', '一条小团团', '芜湖起飞', '内卷狂魔', '王境泽',
        '三岁就会玩', '操作猛如虎', '人狠话不多', '只会蛇皮走位',
        '祖传操作', '不讲武德', '我太难了', '菜到抠脚', '一血送礼', '一条咸鱼', '天胡开局',
        '逆风翻盘王', '绝地求生者', '快乐小憨憨', '挂机小能手', '一碰就碎', '神秘高手',
        '低调奢华', '一刀999', '不服来战', '操作鬼才', '无情收割机', '人间清醒', '小丑竟是我自己',
        '快乐打工魂', '指尖陀螺王', '蛇界李白', '野区小霸王', '一键三连', '高端局混子',
        '莽夫本莽', '无敌是多么寂寞', '蛇皮走位王', '天秀操作', '嘴强王者', '一言不合就送',
        '你猜我几分', '全村的希望', '带妹小能手', '技术有限', '稳中带皮', '风骚走位',
        '蛇行天下', '带线之王', '我真不会玩', '操作似狗', '王者青铜', '人狠话多',
        '快乐蛇蛇', '蛇王争霸', '一条咸鱼', '全能打野', '高冷蛇神', '菜鸡互啄',
        '稳健发育', '蛇皮输出', '浪里小白龙', '蛇界扛把子', '操作一条龙', '天命所归'
    ];
    randomName(){
        const name = this.chineseFunnyNames[Math.floor(Math.random() * this.chineseFunnyNames.length)];
        console.log(name);
        return name;
    }

    rankList = [];

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
        if (this.getUILayer(name)) {
            return;
        }
        node.name = name;
        this.uiContainer.addChild(node);
    }
    removeUILayer(name){
        this.uiContainer.removeChild(this.uiContainer.children.find(node => node.name === name));
    }
    getUILayer(name){
        return this.uiContainer.children.find(node => node.name === name);
    }
}
