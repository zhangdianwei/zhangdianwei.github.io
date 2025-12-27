import { createPixi, initDom } from '../pixi/PixiHelper.js';
import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import TetrisGameView from './TetrisGameView.js';
import TetrisStartView from './TetrisStartView.js';
import TetrisCreateRoomView from './TetrisCreateRoomView.js';
import TetrisNet from './TetrisNet.js';

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

        this.userId = this.genUserId();
        this.players = []; // { userId, name, colorIndex, ip}

        this.eventListeners = {};

        this.net = new TetrisNet(this);
        this.net.init();

        this.viewCreators = {
            "TetrisGameView": TetrisGameView,
            "TetrisStartView": TetrisStartView,
            "TetrisCreateRoomView": TetrisCreateRoomView,
        }

        // 添加 TWEEN 更新到 ticker
        this.pixi.ticker.add(this.update, this);

        this.replaceView("TetrisStartView");
    }

    genUserId() {
        return Math.floor(Math.random() * 1000000);
    }

    update(delta) {
        // 更新 TWEEN 动画
        TWEEN.update();
    }

    replaceView(name) {
        if(this.currentView) {
            this.currentView.safeRemoveSelf();
            this.currentView = null;
        }
        let ViewClass = this.viewCreators[name];
        this.currentView = new ViewClass(this);
        this.currentView.init();
        this.root.addChild(this.currentView);
    }

    on(eventType, callback) {
        if (!this.eventListeners[eventType]) {
            this.eventListeners[eventType] = [];
        }
        this.eventListeners[eventType].push(callback);
        return callback;
    }

    off(eventType, callback) {
        if (!this.eventListeners[eventType]) return;
        const index = this.eventListeners[eventType].indexOf(callback);
        if (index > -1) {
            this.eventListeners[eventType].splice(index, 1);
        }
    }

    emit(eventType, eventData) {
        if (!this.eventListeners[eventType]) return;
        const listeners = [...this.eventListeners[eventType]];
        listeners.forEach(callback => {
            callback(eventType, eventData);
        });
    }
}

export default TetrisGame;