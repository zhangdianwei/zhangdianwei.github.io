import * as PIXI from 'pixi.js';
import { createPixi, initDom } from '../pixi/PixiHelper.js';
import TankPlayerData from './TankPlayerData.js';
import Ticker from './Ticker.js';
import TankGameUI from './TankGameUI.js';
import TankStartUI from './TankStartUI.js';
import TankEndUI from './TankEndUI.js';

export class TankApp {
    static _instance;

    constructor() {
        this.pixi = null;
        this.textures = {};

        this.ticker = null;

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

    init(domElement) {
        initDom(domElement, {
            designWidth: 1920,
            designHeight: 1080,
            isFullScreen: false
        });
        this.pixi = createPixi(domElement);

        this.uiContainer = new PIXI.Container();
        this.pixi.stage.addChild(this.uiContainer);
        this.uiContainer.position.set(this.pixi.screen.width / 2, this.pixi.screen.height / 2);
        // this.uiContainer.alpha = 0.05;

        this.ticker = new Ticker();
        this.ticker.tick((dt) => this.update(dt), 0);

        this.playerData = new TankPlayerData();
        this.setScreen('TankStartUI');
    }

    setScreen(name) {
        if (name === 'TankStartUI') {
            this.mountUI(new TankStartUI());
        } else if (name === 'TankGameUI') {
            this.mountUI(new TankGameUI());
        } else if (name === 'TankEndUI') {
            this.mountUI(new TankEndUI());
        }
    }

    mountUI(ui) {
        let oldUI = this.ui;
        if(oldUI){
            oldUI.removeFromParent();
        }
        this.ui = ui;
        this.uiContainer.addChild(this.ui);
        if (oldUI){
            this.makeUIAppear(this.ui);
        }
    }

    update(dt) {
        if (this.ui && this.ui.update) {
            this.ui.update(dt);
        }
    }

    makeDead() {
        if (this.ui && this.ui.makeDead) {
            this.ui.makeDead();
        }
        this.ui = null;

        if (this.ticker) {
            this.ticker.stop();
            this.ticker = null;
        }
        if (this.pixi) {
            this.pixi.destroy(true);
            this.pixi = null;
        }
        this.uiContainer = null;
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