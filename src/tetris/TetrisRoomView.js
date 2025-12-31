import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import TetrisButton from './TetrisButton.js';
import { TetrisEvents } from './TetrisEvents.js';
import { NetState } from './TetrisNet.js';

export default class TetrisRoomView extends PIXI.Container {
    constructor(game) {
        super();
        this.game = game;
        this.playerItems = [];
        this.isMaster = false;
    }

    init() {
        this.initTitle();
        this.initPlayerList();
        this.initButtons();
        
        this.onPlayerChangedCallback = this.onPlayerChanged.bind(this);
        this.game.on(TetrisEvents.PlayerChanged, this.onPlayerChangedCallback);
        
        this.game.net.syncPlayerList();
        
        this.updatePlayerList();
        this.updateButtons();
    }

    initTitle() {
        this.titleContainer = new PIXI.Container();
        this.titleContainer.position.set(0, -200);
        this.addChild(this.titleContainer);
        this.updateTitle();
    }

    updateTitle() {
        this.titleContainer.removeChildren();
        
        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Comic Sans MS, Marker Felt, Chalkduster, cursive',
            fontSize: 32,
            fill: 0x000000,
            fontWeight: 'bold',
            align: 'center'
        });
        
        let titleText = '房间列表';
        
        const title = new PIXI.Text(titleText, textStyle);
        title.anchor.set(0.5, 0.5);
        title.position.set(0, 0);
        this.titleContainer.addChild(title);
    }

    initPlayerList() {
        this.playerListContainer = new PIXI.Container();
        this.playerListContainer.position.set(0, -50);
        this.addChild(this.playerListContainer);
    }

    updatePlayerList() {
        this.playerItems.forEach(item => {
            if (item.container && item.container.parent) {
                item.container.parent.removeChild(item.container);
            }
        });
        this.playerItems = [];

        const players = this.game.players || [];
        if (players.length === 0) {
            const textStyle = new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0xFFFFFF,
                align: 'center'
            });
            const emptyText = new PIXI.Text('等待玩家加入...', textStyle);
            emptyText.anchor.set(0.5, 0.5);
            emptyText.position.set(0, 0);
            this.playerListContainer.addChild(emptyText);
            return;
        }

        const startY = 0;
        const itemSpacing = 50;
        const itemWidth = 250;
        const itemHeight = 40;

        const currentPlayer = players.find(p => p.userId === this.game.userId);
        this.isMaster = currentPlayer ? currentPlayer.isMaster : false;

        players.forEach((player, index) => {
            const itemContainer = new PIXI.Container();
            itemContainer.position.set(0, startY + index * itemSpacing);
            
            const bg = new PIXI.Graphics();
            bg.beginFill(0x000000, 0.5);
            bg.drawRoundedRect(-itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight, 8);
            bg.endFill();
            itemContainer.addChild(bg);

            const textStyle = new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0xFFFFFF,
                align: 'left'
            });

            const playerId = player.userId || `Player ${player.actorId || index}`;
            let displayText = playerId;
            if (player.isMaster) {
                displayText = '👑 ' + displayText;
            }
            if (player.userId === this.game.userId) {
                displayText = displayText + ' (我)';
            }

            const playerText = new PIXI.Text(displayText, textStyle);
            playerText.anchor.set(0.5, 0.5);
            playerText.position.set(0, 0);
            itemContainer.addChild(playerText);

            this.playerListContainer.addChild(itemContainer);
            this.playerItems.push({
                container: itemContainer,
                player: player
            });
        });
    }

    initButtons() {
        this.buttonContainer = new PIXI.Container();
        this.buttonContainer.position.set(0, 150);
        this.addChild(this.buttonContainer);

        this.backButton = new TetrisButton(this.game, '返回', () => {
            this.leaveRoom();
        });
        this.buttonContainer.addChild(this.backButton);

        this.startButton = new TetrisButton(this.game, '开始游戏', () => {
            this.startGame();
        });
        this.buttonContainer.addChild(this.startButton);
        
        this.updateButtons();
    }

    updateButtons() {
        if (this.startButton) {
            this.startButton.visible = this.isMaster;
        }
        
        const visibleButtons = [];
        if (this.backButton) {
            visibleButtons.push(this.backButton);
        }
        if (this.startButton && this.startButton.visible) {
            visibleButtons.push(this.startButton);
        }
        
        const buttonSpacing = 200;
        const totalWidth = (visibleButtons.length - 1) * buttonSpacing;
        const startX = -totalWidth / 2;
        
        visibleButtons.forEach((button, index) => {
            button.position.set(startX + index * buttonSpacing, 0);
        });
    }

    onPlayerChanged(eventType, eventData) {
        this.updateTitle();
        this.updatePlayerList();
        this.updateButtons();
    }

    leaveRoom() {
        this.game.replaceView("TetrisStartView");
        this.game.net.leaveRoom();
    }

    startGame() {
        if (!this.isMaster) {
            console.warn('只有房主可以开始游戏');
            return;
        }

        // 发送开始游戏事件给所有玩家
        this.game.net.sendEvent(1, { action: 'startGame' });

        // 切换到游戏视图
        this.game.replaceView("TetrisGameView");
    }


    safeRemoveSelf() {
        if (this.onPlayerChangedCallback) {
            this.game.off(TetrisEvents.PlayerChanged, this.onPlayerChangedCallback);
        }
        
        this.removeChildren();
        
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}

