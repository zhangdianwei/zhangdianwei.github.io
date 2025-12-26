import { createPixi, initDom } from '../pixi/PixiHelper.js';
import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import TetrisGameView from './TetrisGameView.js';

class TetrisGame {
    
    init(domElement, textures) {
        initDom(domElement, {
            designWidth: 960,
            designHeight: 540,
            isFullScreen: false
        });
        this.pixi = createPixi(domElement, {
            backgroundAlpha: 0,
        });

        this.root = new PIXI.Container();
        this.pixi.stage.addChild(this.root);
        this.root.position.set(this.pixi.screen.width / 2, this.pixi.screen.height / 2);

        this.textures = textures;

        this.viewCreators = {
            "TetrisGameView": TetrisGameView,
        }

        // 添加 TWEEN 更新到 ticker
        this.pixi.ticker.add(this.update, this);

        this.gotoView("TetrisGameView");
    }

    update(delta) {
        // 更新 TWEEN 动画
        TWEEN.update();
    }

    gotoView(name) {
        if(this.currentView) {
            this.currentView.safeRemoveSelf();
            this.currentView = null;
        }
        let ViewClass = this.viewCreators[name];
        this.currentView = new ViewClass(this);
        this.currentView.init();
        this.root.addChild(this.currentView);
    }
}

export default TetrisGame;