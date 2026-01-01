import { createPixi, initDom } from '../pixi/PixiHelper.js';
import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import TetrisGameView from './TetrisGameView.js';
import TetrisStartView from './TetrisStartView.js';
import TetrisRoomView from './TetrisRoomView.js';
import TetrisNet from './TetrisNet.js';
import { TetrisEvents, NetEventId, GameStartMode } from './data/TetrisEvents.js';
import TetrisPlayer from './data/TetrisPlayer.js';
import TetrisGameStartOption from './data/TetrisGameStartOption.js';

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

        this.uiRoot = new PIXI.Container();
        this.root.addChild(this.uiRoot);

        this.toastRoot = new PIXI.Container();
        this.root.addChild(this.toastRoot);
        this.toasts = [];

        this.textures = textures;

        this.userId = TetrisPlayer.generateUserId('Player');
        this.eventListeners = {};
        this.players = [];

        this.net = new TetrisNet(this);
        this.net.init();

        this.gameStartOption = new TetrisGameStartOption();

        this.viewCreators = {
            "TetrisStartView": TetrisStartView,
            "TetrisGameView": TetrisGameView,
            "TetrisRoomView": TetrisRoomView,
        }

        this.pixi.ticker.add(this.update, this);

        this.replaceView("TetrisStartView");
    }

    syncFromLean(leanPlayers) {
        this.players = leanPlayers.map(p => new TetrisPlayer(p));
        this._notifyPlayerChanged();
    }

    createRobotPlayers(robotCount) {
        const robots = [];
        if (robotCount <= 0) return [];
        for (let i = 0; i < robotCount; i++) {
            const robot = {
                userId: TetrisPlayer.generateUserId('Robot'),
                isRobot: true
            };
            robots.push(robot);
        }
        return robots;
    }

    startGame(mode) {
        var totalPlayerCount = 1;
        if(mode === GameStartMode.Single) {
            this.players.push(new TetrisPlayer({
                userId: this.userId,
                isMaster: true,
                isRobot: false
            }));
            this.GameStartOption.initBySingle(GameStartMode.Single);
            this.replaceView("TetrisGameView");
        } else if(mode === GameStartMode.RobotMatch) {
            this.players.push(new TetrisPlayer({
                userId: this.userId,
                isMaster: true,
                isRobot: false
            }));
            var robots = this.createRobotPlayers(totalPlayerCount-this.players.length);
            robots = robots.map(r => new TetrisPlayer(r));
            this.players.push(...robots);
            this.GameStartOption.initBySingle(GameStartMode.RobotMatch);
            this.replaceView("TetrisGameView");
        } else if(mode === GameStartMode.PlayerMatch) {
            var robots = this.createRobotPlayers(totalPlayerCount-this.players.length);
            this.net.sendEvent(NetEventId.SyncRobots, { robots });
            var option = {
                shapeGeneratorSeed: Date.now()+"",
                startTime: Date.now()+"",
            };
            this.net.sendEvent(NetEventId.StartGame, option);
        }
    }

    findPlayer(userId) {
        return this.players.find(p => p.userId === userId) || null;
    }

    getMyPlayer() {
        return this.findPlayer(this.userId);
    }

    getMyPlayerIndex() {
        return this.players.findIndex(p => p.userId === this.userId);
    }

    _notifyPlayerChanged() {
        this.emit(TetrisEvents.PlayerChanged, { players: this.players });
    }

    get GameStartOption() {
        return this.gameStartOption;
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
        this.uiRoot.addChild(this.currentView);
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

    Toast(message) {
        const toast = new PIXI.Container();
        
        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            align: 'center'
        });
        
        const text = new PIXI.Text(message, textStyle);
        text.anchor.set(0.5, 0.5);
        
        const paddingX = 40;
        const paddingY = 12;
        const bgWidth = Math.max(text.width + paddingX * 2, 200);
        const bgHeight = text.height + paddingY * 2;
        
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.7);
        bg.drawRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 8);
        bg.endFill();
        
        toast.addChild(bg);
        toast.addChild(text);
        
        toast.position.set(0, 0);
        toast.alpha = 0;
        
        this.toastRoot.addChild(toast);
        
        this.toasts.forEach(existingToast => {
            new TWEEN.Tween(existingToast)
                .to({ y: existingToast.y - 60 }, 200)
                .start();
        });
        
        this.toasts.push(toast);
        
        const fadeIn = new TWEEN.Tween(toast)
            .to({ alpha: 1 }, 200)
            .onComplete(() => {
                setTimeout(() => {
                    const fadeOut = new TWEEN.Tween(toast)
                        .to({ alpha: 0, y: toast.y - 30 }, 300)
                        .onComplete(() => {
                            const index = this.toasts.indexOf(toast);
                            if (index > -1) {
                                this.toasts.splice(index, 1);
                            }
                            this.toastRoot.removeChild(toast);
                        })
                        .start();
                }, 2000);
            })
            .start();
    }
}

export default TetrisGame;