import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import TetrisButton from './TetrisButton.js';
import { TetrisEvents } from './TetrisEvents.js';

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
        
        // 监听玩家列表变化事件
        this.onPlayerChangedCallback = this.onPlayerChanged.bind(this);
        this.game.on(TetrisEvents.PlayerChanged, this.onPlayerChangedCallback);
        
        // 初始更新
        this.updatePlayerList();
        this.updateButtons();
    }

    initTitle() {
        const tileSize = 16;
        const letterSpacing = 4;
        const letters = [
            { pattern: this.getRPattern(), colorIndex: 0 },
            { pattern: this.getOPattern(), colorIndex: 1 },
            { pattern: this.getOPattern(), colorIndex: 2 },
            { pattern: this.getMPattern(), colorIndex: 3 }
        ];

        let totalWidth = 0;
        letters.forEach(letter => {
            totalWidth += letter.pattern[0].length * tileSize;
        });
        totalWidth += (letters.length - 1) * letterSpacing;

        const baseY = -200;
        let currentX = -totalWidth / 2;

        letters.forEach((letter, letterIndex) => {
            const letterWidth = letter.pattern[0].length * tileSize;
            const letterHeight = letter.pattern.length * tileSize;
            
            for (let r = 0; r < letter.pattern.length; r++) {
                for (let c = 0; c < letter.pattern[r].length; c++) {
                    if (letter.pattern[r][c]) {
                        const textureUrl = 'tetris/tile' + (letter.colorIndex + 1) + '.png';
                        const texture = this.game.textures[textureUrl];
                        if (texture) {
                            const tileSprite = new PIXI.Sprite(texture);
                            tileSprite.anchor.set(0.5, 0.5);
                            const tileX = currentX + c * tileSize + tileSize / 2;
                            const tileY = baseY + r * tileSize + tileSize / 2 - letterHeight / 2;
                            tileSprite.position.set(tileX, tileY);
                            this.addChild(tileSprite);
                        }
                    }
                }
            }
            currentX += letterWidth + letterSpacing;
        });
    }

    initPlayerList() {
        this.playerListContainer = new PIXI.Container();
        this.playerListContainer.position.set(0, -100);
        this.addChild(this.playerListContainer);
    }

    updatePlayerList() {
        // 清除旧的玩家项
        this.playerItems.forEach(item => {
            if (item.container && item.container.parent) {
                item.container.parent.removeChild(item.container);
            }
        });
        this.playerItems = [];

        const players = this.game.players || [];
        if (players.length === 0) {
            // 如果没有玩家，显示提示信息
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
        const itemSpacing = 60;
        const maxPlayers = 10;

        // 检查当前玩家是否为房主
        const currentPlayer = players.find(p => p.userId === this.game.userId);
        this.isMaster = currentPlayer ? currentPlayer.isMaster : false;

        players.forEach((player, index) => {
            if (index >= maxPlayers) return;

            const itemContainer = new PIXI.Container();
            itemContainer.position.set(0, startY + index * itemSpacing);
            
            // 创建玩家信息背景（使用 tile 作为背景）
            const bgTileSize = 12;
            const bgWidth = 300;
            const bgHeight = 50;
            const bgCols = Math.ceil(bgWidth / bgTileSize);
            const bgRows = Math.ceil(bgHeight / bgTileSize);
            
            for (let r = 0; r < bgRows; r++) {
                for (let c = 0; c < bgCols; c++) {
                    const colorIndex = (r + c) % 7;
                    const textureUrl = 'tetris/tile' + (colorIndex + 1) + '.png';
                    const texture = this.game.textures[textureUrl];
                    if (texture) {
                        const bgTile = new PIXI.Sprite(texture);
                        bgTile.anchor.set(0.5, 0.5);
                        bgTile.alpha = 0.3;
                        bgTile.width = bgTileSize;
                        bgTile.height = bgTileSize;
                        bgTile.position.set(
                            -bgWidth / 2 + c * bgTileSize + bgTileSize / 2,
                            -bgHeight / 2 + r * bgTileSize + bgTileSize / 2
                        );
                        itemContainer.addChild(bgTile);
                    }
                }
            }

            // 创建玩家信息文本
            const textStyle = new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xFFFFFF,
                fontWeight: 'bold',
                align: 'left'
            });

            // 玩家 ID
            const playerId = player.userId || `Player ${player.actorId || index}`;
            const playerIdText = new PIXI.Text(playerId, textStyle);
            playerIdText.anchor.set(0, 0.5);
            playerIdText.position.set(-bgWidth / 2 + 10, -8);
            itemContainer.addChild(playerIdText);

            // 房主标识
            if (player.isMaster) {
                const masterTextStyle = new PIXI.TextStyle({
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fill: 0xFFD700,
                    fontWeight: 'bold'
                });
                const masterText = new PIXI.Text('[房主]', masterTextStyle);
                masterText.anchor.set(0, 0.5);
                masterText.position.set(-bgWidth / 2 + 10, 12);
                itemContainer.addChild(masterText);
            }

            // 高亮当前玩家
            if (player.userId === this.game.userId) {
                const highlight = new PIXI.Graphics();
                highlight.lineStyle(3, 0x00FF00, 1);
                highlight.drawRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 5);
                itemContainer.addChildAt(highlight, 0);
            }

            this.playerListContainer.addChild(itemContainer);
            this.playerItems.push({
                container: itemContainer,
                player: player
            });
        });
    }

    initButtons() {
        this.buttonContainer = new PIXI.Container();
        this.buttonContainer.position.set(0, 180);
        this.addChild(this.buttonContainer);

        // 返回按钮（所有玩家都显示）
        this.backButton = new TetrisButton(this.game, '返回', () => {
            this.leaveRoom();
        });
        this.backButton.position.set(-100, 0);
        this.buttonContainer.addChild(this.backButton);

        // 开始游戏按钮（仅房主显示）
        this.startButton = new TetrisButton(this.game, '开始游戏', () => {
            this.startGame();
        });
        this.startButton.position.set(100, 0);
        this.buttonContainer.addChild(this.startButton);
    }

    updateButtons() {
        // 根据是否为房主显示/隐藏开始游戏按钮
        if (this.startButton) {
            this.startButton.visible = this.isMaster;
        }
    }

    onPlayerChanged(eventType, eventData) {
        this.updatePlayerList();
        this.updateButtons();
    }

    async leaveRoom() {
        try {
            if (this.game.net && this.game.net.client) {
                await this.game.net.client.leaveRoom();
            }
            // 返回开始界面
            this.game.replaceView("TetrisStartView");
        } catch (error) {
            console.error('离开房间失败:', error);
        }
    }

    startGame() {
        if (!this.isMaster) {
            console.warn('只有房主可以开始游戏');
            return;
        }

        // 发送开始游戏事件给所有玩家
        if (this.game.net) {
            this.game.net.sendEvent(1, { action: 'startGame' });
        }

        // 切换到游戏视图
        this.game.replaceView("TetrisGameView");
    }

    getRPattern() {
        return [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
            [1, 0, 1, 0, 0],
            [1, 0, 0, 1, 0],
            [1, 0, 0, 0, 1]
        ];
    }

    getOPattern() {
        return [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0]
        ];
    }

    getMPattern() {
        return [
            [1, 0, 0, 0, 1],
            [1, 1, 0, 1, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1]
        ];
    }

    safeRemoveSelf() {
        // 移除事件监听
        if (this.onPlayerChangedCallback) {
            this.game.off(TetrisEvents.PlayerChanged, this.onPlayerChangedCallback);
        }
        
        // 移除所有子元素
        this.removeChildren();
        
        // 从父容器移除
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}

