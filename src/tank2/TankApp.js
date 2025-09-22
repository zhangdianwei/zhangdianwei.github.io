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
        let oldUI = this.ui;
        if(oldUI){
            oldUI.removeFromParent();
            // this.makeUIDisappear(oldUI, () => {
            //     oldUI.removeFromParent();
            // });
        }
        this.ui = ui;
        this.uiContainer.addChild(this.ui);
        if (oldUI){
            this.makeUIAppear(this.ui);
        }

        this.uiContainer.alpha = 0.1;
    }

    get winW(){
        return this.pixi.screen.width;
    }

    get winH(){
        return this.pixi.screen.height;
    }

    makeUIAppear(node, callback){
        if (!node) return;
        
        // 设置初始位置（屏幕右边缘）
        node.x = this.winW / 2;
        node.visible = true;
        
        // 使用PIXI的动画系统实现从右滑入效果
        const startTime = Date.now();
        const animationDuration = 0.5; // 动画持续时间（秒）
        const startX = this.winW / 2; // 起始位置（右边缘）
        const endX = 0; // 结束位置（中心）
        
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / animationDuration, 1);
            
            // 使用缓动函数实现平滑的滑入效果
            const easedProgress = this.easeOutCubic(progress);
            node.x = startX + (endX - startX) * easedProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (callback) callback();
                if (node.onAppearFinish) {
                    node.onAppearFinish();
                }
            }
        };
        
        requestAnimationFrame(animate);
    }

    makeUIDisappear(node, callback){
        if (!node) return;
        
        // 使用PIXI的动画系统实现向左滑出效果
        const startTime = Date.now();
        const animationDuration = 0.5; // 动画持续时间（秒）
        const startX = 0; // 起始位置（中心）
        const endX = -this.winW / 2; // 结束位置（左边缘）
        
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / animationDuration, 1);
            
            // 使用缓动函数实现平滑的滑出效果
            const easedProgress = this.easeInCubic(progress);
            node.x = startX + (endX - startX) * easedProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (callback) callback();
            }
        };
        
        requestAnimationFrame(animate);
    }

    // 缓动函数：三次方缓出
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // 缓动函数：三次方缓入
    easeInCubic(t) {
        return t * t * t;
    }
} 