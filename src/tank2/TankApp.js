export class TankApp {
    static _instance;

    constructor() {
        this.pixi = null;
        this.gameContainer = null;
        this.textures = {};

        // 全局时钟（在 TankLogic 中初始化）
        this.ticker = null;
        
        this.logic = null;
        
        // 关卡游戏对象
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        
        // 关卡数据
        this.levelData = null;
        
        // 渲染层
        this.renderLayers = {
            background: null,
            tiles: null,
            tank: null,
            bullets: null,
            grass: null,
            effect: null
        };
    }

    static get instance() {
        if (!TankApp._instance) {
            TankApp._instance = new TankApp();
        }
        return TankApp._instance;
    }

    clear(){
        this.ticker.stop();
    }
} 