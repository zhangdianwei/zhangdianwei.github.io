import { createPixi, initDom } from '../pixi/PixiHelper.js';
import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import TetrisGameView from './TetrisGameView.js';
import TetrisStartView from './TetrisStartView.js';
import TetrisNet from './TetrisNet.js';
import { TetrisEvents } from './TetrisEvents.js';

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
        this.eventListeners = {};
        this.setPlayers([]);

        this.net = new TetrisNet(this);
        this.net.init();

        this.viewCreators = {
            "TetrisStartView": TetrisStartView,
            "TetrisGameView": TetrisGameView,
        }

        this.pixi.ticker.add(this.update, this);

        this.replaceView("TetrisStartView");
    }

    setPlayers(players) {
        this.players = players;
        this.emit(TetrisEvents.PlayerChanged, {
            players: this.players
        });
    }

    addPlayer(player) {
        if (this.players.find(p => p.userId === player.userId)) return;
        this.setPlayers([...this.players, player]);
        if (this.net) {
            this.net.updatePlayerList();
        }
    }

    removePlayer(userId) {
        this.setPlayers(this.players.filter(p => p.userId !== userId));
        if (this.net) {
            this.net.updatePlayerList();
        }
    }

    getMyPlayerIndex() {
        return this.players.findIndex(p => p.userId === this.userId);
    }

    genUserId() {
        return "zhangdw"
        return "Player" + Math.floor(Math.random() * 10000);
    }

    update(delta) {
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