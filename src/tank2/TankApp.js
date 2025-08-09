export class TankApp {
    static _instance;

    constructor() {
        this.pixi = null;
        this.gameContainer = null;
        this.textures = {};

        
        // 游戏对象
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        
        // 关卡数据
        this.levelData = null;
        
        // 渲染层
        this.renderLayers = {
            background: null,
            tiles: null,
            enemies: null,
            player: null,
            bullets: null,
            grass: null
        };
        

    }

    static get instance() {
        if (!TankApp._instance) {
            TankApp._instance = new TankApp();
        }
        return TankApp._instance;
    }


} 