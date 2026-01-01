import * as PIXI from 'pixi.js';
import TetrisButton from './TetrisButton.js';
import { TetrisEvents, NetEventId } from './data/TetrisEvents.js';

const TEXT_STYLE = new PIXI.TextStyle({
    fontFamily: 'Comic Sans MS, Marker Felt, Chalkduster, cursive',
    fontSize: 18,
    fill: 0x000000,
    align: 'center'
});

const TITLE_STYLE = new PIXI.TextStyle({
    fontFamily: 'Comic Sans MS, Marker Felt, Chalkduster, cursive',
    fontSize: 32,
    fill: 0x000000,
    fontWeight: 'bold',
    align: 'center'
});

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
        
        this.updatePlayerList();
        this.updateButtons();
    }

    initTitle() {
        this.titleContainer = new PIXI.Container();
        this.titleContainer.position.set(0, -200);
        this.addChild(this.titleContainer);
        
        const title = new PIXI.Text('房间列表', TITLE_STYLE);
        title.anchor.set(0.5, 0.5);
        this.titleContainer.addChild(title);
    }

    initPlayerList() {
        this.playerListContainer = new PIXI.Container();
        this.playerListContainer.position.set(0, -50);
        this.addChild(this.playerListContainer);
    }

    updatePlayerList() {
        this.playerItems.forEach(item => {
            if (item.container?.parent) {
                item.container.parent.removeChild(item.container);
            }
        });
        this.playerItems = [];

        const players = this.game.players || [];
        if (players.length === 0) {
            const emptyText = new PIXI.Text('等待玩家加入...', TEXT_STYLE);
            emptyText.anchor.set(0.5, 0.5);
            this.playerListContainer.addChild(emptyText);
            return;
        }

        const currentPlayer = players.find(p => p.userId === this.game.userId);
        this.isMaster = currentPlayer?.isMaster || false;

        players.forEach((player, index) => {
            const itemContainer = this.createPlayerItem(player, index);
            this.playerListContainer.addChild(itemContainer);
            this.playerItems.push({ container: itemContainer, player });
        });
    }

    createPlayerItem(player, index) {
        const itemContainer = new PIXI.Container();
        itemContainer.position.set(0, index * 50);
        
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.5);
        bg.drawRoundedRect(-125, -20, 250, 40, 8);
        bg.endFill();
        itemContainer.addChild(bg);

        let displayText = player.isRobot ? `🤖 ${player.userId}` : player.userId;
        if (player.isMaster) displayText = '👑 ' + displayText;
        if (player.userId === this.game.userId) displayText += ' (我)';

        const playerText = new PIXI.Text(displayText, TEXT_STYLE);
        playerText.anchor.set(0.5, 0.5);
        itemContainer.addChild(playerText);

        return itemContainer;
    }

    initButtons() {
        this.buttonContainer = new PIXI.Container();
        this.buttonContainer.position.set(0, 150);
        this.addChild(this.buttonContainer);

        this.startButton = new TetrisButton(this.game, '开始游戏', () => {
            this.startGame();
        });

        this.waitingText = new PIXI.Text('等待房主开启游戏', TEXT_STYLE);
        this.waitingText.anchor.set(0.5, 0.5);
        
        this.updateButtons();
    }

    updateButtons() {
        this.buttonContainer.removeChildren();
        
        if (this.isMaster) {
            this.buttonContainer.addChild(this.startButton);
        } else {
            this.buttonContainer.addChild(this.waitingText);
        }
    }

    onPlayerChanged() {
        this.updatePlayerList();
        this.updateButtons();
    }

    startGame() {
        if (!this.isMaster) {
            console.warn('只有房主可以开始游戏');
            return;
        }

        this.game.fillRobotPlayers();

        // 将时间戳转换为字符串，避免 LeanCloud Play SDK 序列化大数字时的 Int32 溢出问题
        const now = Date.now();
        const startOption = {
            shapeGeneratorSeed: String(1000),
            startTime: String(now),
        };
        this.game.net.sendEvent(NetEventId.StartGame, startOption);
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

