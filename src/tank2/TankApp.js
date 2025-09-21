export class TankApp {
    static _instance;

    constructor() {
        this.pixi = null;
        this.gameContainer = null;
        this.textures = {};

        // 全局时钟（在 TankLogic 中初始化）
        this.ticker = null;
        
        this.logic = null;
        
        this.ui = null;
        this.uiContainer = null; //屏幕中心
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

    setUI(ui) {
        if (this.ui) {
            this.ui.removeFromParent();
        }
        this.ui = ui;
        this.uiContainer.addChild(this.ui);
    }

    get winW(){
        return this.pixi.screen.width;
    }

    get winH(){
        return this.pixi.screen.height;
    }
    
    // 向后兼容的getter方法，通过ui访问游戏数据
    get player() {
        return this.ui ? this.ui.player : null;
    }
    
    get enemies() {
        return this.ui ? this.ui.enemies : [];
    }
    
    get playerBullets() {
        return this.ui ? this.ui.playerBullets : [];
    }
    
    get enemyBullets() {
        return this.ui ? this.ui.enemyBullets : [];
    }
    
    get levelData() {
        return this.ui;
    }
    
    get renderLayers() {
        return this.ui ? this.ui.renderLayers : null;
    }
} 