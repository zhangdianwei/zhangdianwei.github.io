import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import TetrisButton from './TetrisButton.js';
import { NetState } from './TetrisNet.js';

export default class TetrisStartView extends PIXI.Container {
    constructor(game) {
        super();
        this.game = game;
    }

    init() {
        this.initTitle();
        
        // Single Player 按钮 - 单人游戏
        this.singlePlayerButton = new TetrisButton(this.game, 'Single Player', () => {
            this.game.GameStartOption = {
                shapeGeneratorSeed: Date.now()
            };
            this.game.replaceView("TetrisGameView");
        });
        this.singlePlayerButton.position.set(0, 30);
        this.addChild(this.singlePlayerButton);

        // Match Player 按钮 - 匹配玩家（多人游戏）
        this.matchPlayerButton = new TetrisButton(this.game, 'Match Player', () => {
            this.joinMatch();
        });
        this.matchPlayerButton.position.set(0, 90);
        this.addChild(this.matchPlayerButton);

        this.clickMatchCount = 0;

        this.animationTime = 0;
        this.tagUpdate = this.update.bind(this);
        this.game.pixi.ticker.add(this.tagUpdate, this);
    }

    async joinMatch() {
        // if (this.game.net.state === NetState.IN_ROOM) {
        //     this.game.replaceView("TetrisRoomView");
        //     return;
        // }

        this.clickMatchCount++;

        if (this.game.net.state === NetState.IDLE) {
            this.game.net.connect();
        } else if (this.game.net.state === NetState.CONNECTED) {
            this.game.net.joinRoom();
        }

        if (this.clickMatchCount >= 2) {
            if (this.game.net.state === NetState.CONNECTING) {
                this.game.Toast('正在连接服务器...');
            } else if (this.game.net.state === NetState.CONNECTED) {
                this.game.Toast('已连接，正在加入房间...');
            } else if (this.game.net.state === NetState.JOINING) {
                this.game.Toast('正在加入房间...');
            }
        }
    }

    initTitle() {
        const tileSize = 20;
        const letterSpacing = 5;
        const letters = [
            { pattern: this.getTPattern(), colorIndex: 0 },
            { pattern: this.getEPattern(), colorIndex: 1 },
            { pattern: this.getTPattern(), colorIndex: 2 },
            { pattern: this.getRPattern(), colorIndex: 3 },
            { pattern: this.getIPattern(), colorIndex: 4 },
            { pattern: this.getSPattern(), colorIndex: 5 }
        ];

        let totalWidth = 0;
        letters.forEach(letter => {
            totalWidth += letter.pattern[0].length * tileSize;
        });
        totalWidth += (letters.length - 1) * letterSpacing;

        const maxRow = 6;
        const maxAmplitude = 8;
        this.titleTiles = [];
        for (let r = 0; r <= maxRow; r++) {
            this.titleTiles[r] = [];
        }
        const baseY = -100;

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
                            
                            const globalRow = r;
                            const rowRatio = (maxRow - globalRow) / maxRow;
                            const amplitude = maxAmplitude * rowRatio;
                            
                            this.titleTiles[globalRow].push({
                                sprite: tileSprite,
                                baseX: tileX,
                                amplitude: amplitude
                            });
                        }
                    }
                }
            }
            currentX += letterWidth + letterSpacing;
        });
    }

    update(delta) {
        this.animationTime += delta;
        const baseSpeed = 0.02;
        
        for (let r = 0; r < this.titleTiles.length; r++) {
            const offset = this.animationTime * baseSpeed;
            for (let i = 0; i < this.titleTiles[r].length; i++) {
                const tile = this.titleTiles[r][i];
                const x = tile.baseX + Math.sin(offset) * tile.amplitude;
                tile.sprite.position.x = x;
            }
        }
    }

    getTPattern() {
        return [
            [1, 1, 1, 1, 1],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0]
        ];
    }

    getEPattern() {
        return [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1]
        ];
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

    getIPattern() {
        return [
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 1]
        ];
    }

    getSPattern() {
        return [
            [0, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [1, 1, 1, 1, 0]
        ];
    }

    safeRemoveSelf() {
        if (this.tagUpdate) {
            this.game.pixi.ticker.remove(this.tagUpdate, this);
        }
        this.parent.removeChild(this);
    }
}

