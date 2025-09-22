export class TankApp {
    static _instance;

    constructor() {
        this.pixi = null;
        this.textures = {};

        // 全局时钟（在 TankLogic 中初始化）
        this.ticker = null;
        
        this.logic = null;
        
        this.ui = null;
        this.uiContainer = null; //屏幕中心

        this.playerData = null;
    }

    static get instance() {
        if (!TankApp._instance) {
            TankApp._instance = new TankApp();
        }
        return TankApp._instance;
    }

    setUI(ui) {
        if (this.ui) {
            this.ui.removeFromParent();
        }
        this.ui = ui;
        this.uiContainer.addChild(this.ui);
        this.ui.alpha = 0.05;
    }

    get winW(){
        return this.pixi.screen.width;
    }

    get winH(){
        return this.pixi.screen.height;
    }
} 