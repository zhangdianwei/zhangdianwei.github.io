import * as PIXI from 'pixi.js';
import { createPixi, initDom } from '../pixi/PixiHelper.js';
import { TankApp } from './TankApp.js';
import TankPlayerData from './TankPlayerData.js';
import Ticker from './Ticker.js';
import TankGameUI from './TankGameUI.js';
import TankStartUI from './TankStartUI.js';
import TankEndUI from './TankEndUI.js';

export class TankLogic {
    constructor() {
        this.tankApp = TankApp.instance;
    }

    init(domElement) {
        // 初始化DOM尺寸
        initDom(domElement, {
            designWidth: 1920,
            designHeight: 1080,
            isFullScreen: false
        });
        this.tankApp.pixi = createPixi(domElement);

        this.tankApp.uiContainer = new PIXI.Container();
        this.tankApp.pixi.stage.addChild(this.tankApp.uiContainer);
        this.tankApp.uiContainer.position.set(this.tankApp.pixi.screen.width / 2, this.tankApp.pixi.screen.height / 2);

        this.tankApp.ticker = new Ticker();
        this._gameTickId = this.tankApp.ticker.tick((dt) => this.update(dt), 0);

        this.tankApp.playerData = new TankPlayerData();

        this.setUI("TankStartUI");
    }

    setUI(name) {
        if(name === 'TankStartUI') {
            this.tankApp.setUI(new TankStartUI());
        }
        else if(name === 'TankGameUI') {
            this.tankApp.setUI(new TankGameUI());
        }
        else if(name === 'TankEndUI') {
            this.tankApp.setUI(new TankEndUI());
        }
    }

    update(dt) {
        if(this.tankApp.ui && this.tankApp.ui.update){
            this.tankApp.ui.update(dt);
        }
    }

    makeDead() {
        if (this.tankApp.ticker) {
            this.tankApp.ticker.stop();
            this.tankApp.ticker = null;
        }
        if (this.tankApp.pixi) {
            this.tankApp.pixi.destroy(true);
            this.tankApp.pixi = null;
        }
    }
} 