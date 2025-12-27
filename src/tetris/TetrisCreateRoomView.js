import * as PIXI from 'pixi.js';
import TetrisButton from './TetrisButton.js';
import TetrisSprite9 from './TetrisSprite9.js';
import * as TetrisShape from './TetrisShape.js';

export default class TetrisCreateRoomView extends PIXI.Container {
    constructor(game) {
        super();
        this.game = game;
        this.sdpChangedHandler = null;
    }

    init() {
        this.initTopBar();
        this.initSDP();
        this.initPlayerSlots();
        this.updatePlayerSlots();
    }

    initSDP() {
        this.sdpChangedHandler = () => this.updateSDPLabel();
        this.game.on('netSDPChanged', this.sdpChangedHandler);
        
        if (!this.game.net.getSDP()) {
            this.game.net.fetchSDP();
        }
        this.updateSDPLabel();
    }

    initTopBar() {
        const topY = -150;
        const bottomY = 200;

        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Comic Sans MS, Marker Felt, Chalkduster, cursive',
            fontSize: 18,
            fill: 0x000000,
            fontWeight: 'bold',
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 800
        });

        const roomSDPLabel = new PIXI.Text('', textStyle);
        roomSDPLabel.anchor.set(0.5, 0.5);
        roomSDPLabel.position.set(0, topY);
        roomSDPLabel.eventMode = 'static';
        roomSDPLabel.on('pointerdown', () => {
            const sdp = this.game.net.getSDP();
            if (sdp) {
                this.copySDPToClipboard();
            } else {
                this.game.net.fetchSDP();
                this.updateSDPLabel();
            }
        });
        this.addChild(roomSDPLabel);
        this.roomSDPLabel = roomSDPLabel;

        const backButton = new TetrisButton(this.game, 'Back', () => {
            this.game.replaceView("TetrisStartView");
        });
        backButton.position.set(-100, bottomY);
        this.addChild(backButton);

        const playButton = new TetrisButton(this.game, 'Play', () => {
            // TODO: 实现开始游戏的逻辑
        });
        playButton.position.set(100, bottomY);
        this.addChild(playButton);
    }

    updateSDPLabel() {
        if (!this.roomSDPLabel) return;
        
        const sdp = this.game.net.getSDP();
        const isFetching = this.game.net.isFetchingSDP;
        
        if (sdp) {
            this.roomSDPLabel.text = `房间已生成(点击复制)`;
            this.roomSDPLabel.cursor = 'pointer';
        } else if (isFetching) {
            this.roomSDPLabel.text = '正在创建房间...';
            this.roomSDPLabel.cursor = 'default';
        } else {
            this.roomSDPLabel.text = '生成房间信息失败(点击重试)';
            this.roomSDPLabel.cursor = 'pointer';
        }
    }

    copySDPToClipboard() {
        const sdp = this.game.net.getSDP();
        if (!sdp) return;
        
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(sdp)
                .then(() => {
                    this.roomSDPLabel.text = 'SDP 已复制！';
                    this.roomSDPLabel.cursor = 'default';
                    setTimeout(() => this.updateSDPLabel(), 2000);
                })
                .catch(err => {
                    console.error('复制失败:', err);
                    alert('无法复制到剪贴板，请手动复制控制台中的 SDP');
                });
        } else {
            alert('浏览器不支持剪贴板 API，请手动复制控制台中的 SDP');
        }
    }

    initPlayerSlots() {
        this.playerSlots = [];
        const slotWidth = 200;
        const slotHeight = 80;
        const slotSpacingX = 250;
        const slotSpacingY = 100;
        const colCount = 3;
        const totalWidth = slotSpacingX * (colCount - 1);
        const totalHeight = slotSpacingY;
        const startX = -totalWidth / 2;
        const startY = -totalHeight / 2;

        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Comic Sans MS, Marker Felt, Chalkduster, cursive',
            fontSize: 16,
            fill: 0x000000,
            fontWeight: 'bold',
            align: 'center'
        });

        const addButtonTextStyle = new PIXI.TextStyle({
            fontFamily: 'Comic Sans MS, Marker Felt, Chalkduster, cursive',
            fontSize: 32,
            fill: 0x000000,
            fontWeight: 'bold',
            align: 'center'
        });

        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                const slotContainer = new PIXI.Container();
                const centerX = startX + col * slotSpacingX;
                slotContainer.position.set(centerX, startY + row * slotSpacingY);
                this.addChild(slotContainer);

                const bgTexture = this.game.textures['tetris/bg_total.png'];
                const slotBg = new TetrisSprite9(
                    bgTexture,
                    slotWidth,
                    slotHeight,
                    50, 50, 50, 50
                );
                slotContainer.addChild(slotBg);

                const nameText = new PIXI.Text('', textStyle);
                nameText.anchor.set(0.5, 0.5);
                nameText.position.set(0, 0);
                nameText.visible = false;
                slotContainer.addChild(nameText);

                const addButtonText = new PIXI.Text('+', addButtonTextStyle);
                addButtonText.anchor.set(0.5, 0.5);
                addButtonText.position.set(0, 0);
                addButtonText.visible = false;
                addButtonText.eventMode = 'static';
                addButtonText.cursor = 'pointer';
                slotContainer.addChild(addButtonText);

                const slotIndex = row * 3 + col;
                addButtonText.on('pointerdown', () => {
                    this.addBotAtSlot(slotIndex);
                });

                this.playerSlots.push({
                    container: slotContainer,
                    bg: slotBg,
                    nameText: nameText,
                    addButtonText: addButtonText,
                    slotIndex: slotIndex
                });
            }
        }
    }

    updatePlayerSlots() {
        for (let i = 0; i < this.playerSlots.length; i++) {
            const slot = this.playerSlots[i];
            const player = this.game.players[i] || null;

            if (player) {
                slot.bg.tint = player.color || 0x808080;
                slot.nameText.text = player.name;
                slot.nameText.visible = true;
                slot.addButtonText.visible = false;
            } else {
                slot.bg.tint = 0xffffff;
                slot.nameText.visible = false;
                slot.addButtonText.visible = true;
            }
        }
    }

    addBotAtSlot(slotIndex) {
        if (this.game.players.length >= 6) {
            return;
        }

        if (slotIndex < this.game.players.length) {
            return;
        }

        const botNum = this.game.players.filter(p => p.role === 'bot').length + 1;
        const colorIndex = Math.floor(Math.random() * TetrisShape.colorIndexCount);
        const color = TetrisShape.colorIndexColors[colorIndex];

        this.game.players.push({
            id: this.game.players.length + 1,
            name: `robot${botNum}`,
            avatar: null,
            role: 'bot',
            color: color
        });

        this.updatePlayerSlots();
    }

    safeRemoveSelf() {
        if (this.sdpChangedHandler) {
            this.game.off('netSDPChanged', this.sdpChangedHandler);
            this.sdpChangedHandler = null;
        }
        this.parent.removeChild(this);
    }
}

