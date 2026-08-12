import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import * as TetrisShape from './TetrisShape.js';
import { theme } from './theme.js';

export default class PlayHudView extends PIXI.Container {

    constructor(dialog) {
        super();
        this.dialog = dialog;
        this.app = dialog.app;
    }

    init() {
        this.initInfoDisplay();
        this.initUserInfoDisplay();
        this.initBuffDisplay();
        this.initNextShapePreview();
    }

    initInfoDisplay() {
        // 创建信息展示容器
        this.infoDisplayContainer = new PIXI.Container();
        this.infoDisplayContainer.position.set(125, -150);
        this.addChild(this.infoDisplayContainer);

        // 创建底板
        this.infoDisplayBg = new PIXI.Sprite(this.app.textures.bgPanel);
        this.infoDisplayBg.anchor.set(0, 0);
        this.infoDisplayContainer.addChild(this.infoDisplayBg);

        // 创建文本样式（黑色字体）
        const textStyle = new PIXI.TextStyle({
            fontFamily: theme.fontFamily,
            fontSize: theme.hudFontSize,
            fill: 0x000000,
            align: 'left'
        });

        const ruleMgr = this.dialog.ruleMgr;
        this.infoDisplayConfigs = [
            { title: 'Level:', getValue: () => ruleMgr.getLevel(), valueLabel: null },
            { title: 'Lines:', getValue: () => ruleMgr.linesCleared, valueLabel: null },
            { title: 'Score:', getValue: () => ruleMgr.score, valueLabel: null },
        ]

        this.infoDisplayConfigs.forEach((config, index) => {
            const y = 8 + index * 22;

            const label = new PIXI.Text(config.title, textStyle);
            label.anchor.set(1, 0);
            label.x = 60;
            label.y = y;
            this.infoDisplayContainer.addChild(label);

            const value = new PIXI.Text('0', textStyle);
            value.anchor.set(0, 0);
            value.x = 64;
            value.y = y;
            this.infoDisplayContainer.addChild(value);
            config.valueLabel = value;

            this.animRollNum(value, config.getValue());
        });
    }

    initUserInfoDisplay() {
        // 创建用户信息展示容器，放在 info 区下面
        this.userInfoDisplayContainer = new PIXI.Container();
        // info 区位置是 (125, -150)，info 区高度大约是 86，所以 userInfo 放在 (125, -150 + 86 + 10) = (125, -54)
        this.userInfoDisplayContainer.position.set(125, -54);
        this.addChild(this.userInfoDisplayContainer);

        // 创建底板
        this.userInfoDisplayBg = new PIXI.Sprite(this.app.textures.bgPanel);
        this.userInfoDisplayBg.anchor.set(0, 0);
        this.userInfoDisplayContainer.addChild(this.userInfoDisplayBg);

        // 创建文本样式（黑色字体）
        const textStyle = new PIXI.TextStyle({
            fontFamily: theme.fontFamily,
            fontSize: theme.hudFontSize,
            fill: 0x000000,
            align: 'left'
        });

        const userId = this.dialog.player.userId;

        // 显示用户ID
        const userIdLabel = new PIXI.Text('User:', textStyle);
        userIdLabel.anchor.set(1, 0);
        userIdLabel.x = 50;
        userIdLabel.y = 14;
        this.userInfoDisplayContainer.addChild(userIdLabel);

        const userIdValue = new PIXI.Text(userId, textStyle);
        userIdValue.anchor.set(0, 0);
        userIdValue.x = 55;
        userIdValue.y = 14;
        this.userInfoDisplayContainer.addChild(userIdValue);
    }

    initBuffDisplay() {
        this.buffDisplayContainer = new PIXI.Container();
        this.buffDisplayContainer.position.set(125, 45);
        this.addChild(this.buffDisplayContainer);

        this.buffDisplayBg = new PIXI.Sprite(this.app.textures.bgPanel);
        this.buffDisplayBg.anchor.set(0, 0);
        this.buffDisplayContainer.addChild(this.buffDisplayBg);

        const textStyle = new PIXI.TextStyle({
            fontFamily: theme.fontFamily,
            fontSize: theme.hudFontSize,
            fill: 0x000000,
            align: 'left'
        });

        this.buffDescLabel = new PIXI.Text('', textStyle);
        this.buffDescLabel.anchor.set(0, 0);
        this.buffDescLabel.x = 10;
        this.buffDescLabel.y = 8;
        this.buffDisplayContainer.addChild(this.buffDescLabel);

        this.buffProgressLabel = new PIXI.Text('0/0', textStyle);
        this.buffProgressLabel.anchor.set(0, 0);
        this.buffProgressLabel.x = 10;
        this.buffProgressLabel.y = 28;
        this.buffDisplayContainer.addChild(this.buffProgressLabel);

        this.updateBuffDisplay();
    }

    updateBuffDisplay() {
        if (!this.buffDescLabel || !this.buffProgressLabel)
            return;
        const currentBuff = this.dialog.ruleMgr.currentBuff;
        if (!currentBuff) {
            this.buffDescLabel.text = '';
            this.buffProgressLabel.text = '';
            return;
        }

        this.buffDescLabel.text = `buff：${currentBuff.desc}`;
        this.buffProgressLabel.text = `进度：${this.dialog.ruleMgr.buffProgress}/${currentBuff.maxCount}`;
    }

    getBuffFlyTarget() {
        if (!this.buffDisplayContainer || !this.buffProgressLabel) return null;
        return {
            x: this.buffDisplayContainer.position.x + this.buffProgressLabel.x + this.buffProgressLabel.width / 2,
            y: this.buffDisplayContainer.position.y + this.buffProgressLabel.y + this.buffProgressLabel.height / 2
        };
    }

    animRollNum(valueObj, targetNum) {
        // 如果没有 animState，创建默认的并直接设置值
        if (!valueObj.animState) {
            valueObj.animState = { current: targetNum, target: targetNum, tween: null };
            valueObj.text = targetNum.toString();
            return;
        }

        const animState = valueObj.animState;

        // 如果 target 和 targetNum 一样，什么都不做
        if (animState.target === targetNum) {
            return;
        }

        // 更新 target
        animState.target = targetNum;

        // 如果存在旧动画，停止它
        if (animState.tween) {
            animState.tween.stop();
        }

        // 从 animState 中获取当前值（current）
        const currentValue = animState.current;

        // 创建新的滚动动画，从 current 变化到 targetNum
        animState.tween = new TWEEN.Tween({ value: currentValue })
            .to({ value: targetNum }, 200)
            .onUpdate((obj) => {
                const roundedValue = Math.round(obj.value);
                animState.current = roundedValue;
                valueObj.text = roundedValue.toString();
            })
            .onComplete(() => {
                // 动画完成后，确保值精确等于目标值
                animState.current = targetNum;
                valueObj.text = targetNum.toString();
            })
            .start();
    }

    updateInfoDisplay() {
        if (!this.infoDisplayContainer) return;
        this.infoDisplayConfigs.forEach((config) => {
            this.animRollNum(config.valueLabel, config.getValue());
        });
    }

    initNextShapePreview() {
        // 创建预览容器
        this.nextShapePreviewContainer = new PIXI.Container();

        // 获取棋盘背景的右边缘位置
        const boardBg = this.dialog.gameView.boardBg;
        const boardBgRight = boardBg.x + boardBg.width / 2;

        // 创建底板
        this.nextShapePreviewBg = new PIXI.Sprite(this.app.textures.bgPanel);
        this.nextShapePreviewBg.anchor.set(0, 0.5); // 左锚点，垂直居中
        this.nextShapePreviewBg.x = boardBgRight; // 紧贴棋盘背景的右侧
        this.nextShapePreviewBg.y = -200; // 与棋盘背景同一水平线
        this.nextShapePreviewContainer.addChild(this.nextShapePreviewBg);

        // 存储预览 tile 的容器
        this.nextShapePreviewTiles = [[], []]; // [0] 用于 nextShapInfos[0], [1] 用于 nextShapInfos[1]

        this.addChild(this.nextShapePreviewContainer);

        // 初始化显示
        this.updateNextShapePreview();
    }

    updateNextShapePreview() {
        if (!this.nextShapePreviewContainer || this.nextShapePreviewTiles.length < 2) {
            return;
        }

        // 清除旧的预览 tile
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < this.nextShapePreviewTiles[i].length; j++) {
                if (this.nextShapePreviewTiles[i][j].parent) {
                    this.nextShapePreviewTiles[i][j].parent.removeChild(this.nextShapePreviewTiles[i][j]);
                }
            }
            this.nextShapePreviewTiles[i] = [];
        }

        const nextShapInfos = this.dialog.ruleMgr.nextShapInfos;
        if (!nextShapInfos || nextShapInfos.length < 2) {
            return;
        }

        // 获取底板的位置和尺寸
        const bgLeft = this.nextShapePreviewBg.x;
        const bgWidth = this.nextShapePreviewBg.width;
        const bgY = this.nextShapePreviewBg.y;

        const previewTileSize = 15; // 预览 tile 的大小，比游戏中的小

        // 左侧部分：显示 nextShapInfos[0] (不透明)
        const leftX = bgLeft + bgWidth * 0.25; // 左侧 1/4 位置（左侧部分的中心）
        const leftY = bgY;
        this.renderShapePreview(nextShapInfos[0], leftX, leftY, previewTileSize, 1.0, 0);

        // 右侧部分：显示 nextShapInfos[1] (半透明)
        const rightX = bgLeft + bgWidth * 0.75; // 右侧 3/4 位置（右侧部分的中心）
        const rightY = bgY;
        this.renderShapePreview(nextShapInfos[1], rightX, rightY, previewTileSize, 0.5, 1);
    }

    renderShapePreview(shapeInfo, centerX, centerY, tileSize, alpha, previewIndex) {
        if (!shapeInfo) return;

        const shapeDef = TetrisShape.TetrisShapeDef[shapeInfo.shapeType];
        const shapeTiles = shapeDef.rotations[0];

        // 计算形状的边界
        let minR = Infinity, maxR = -Infinity;
        let minC = Infinity, maxC = -Infinity;
        for (let r = 0; r < shapeTiles.length; r++) {
            for (let c = 0; c < shapeTiles[r].length; c++) {
                if (shapeTiles[r][c] > 0) {
                    minR = Math.min(minR, r);
                    maxR = Math.max(maxR, r);
                    minC = Math.min(minC, c);
                    maxC = Math.max(maxC, c);
                }
            }
        }

        // 计算形状的中心偏移
        const shapeWidth = (maxC - minC + 1) * tileSize;
        const shapeHeight = (maxR - minR + 1) * tileSize;
        const offsetX = -shapeWidth / 2 + tileSize / 2;
        const offsetY = -shapeHeight / 2 + tileSize / 2;

        // 创建 tile
        const texture = this.app.textures['tile' + (shapeInfo.colorIndex + 1)];

        for (let r = 0; r < shapeTiles.length; r++) {
            for (let c = 0; c < shapeTiles[r].length; c++) {
                if (shapeTiles[r][c] > 0) {
                    const tileSprite = new PIXI.Sprite(texture);
                    tileSprite.anchor.set(0.5, 0.5);
                    tileSprite.alpha = alpha;
                    tileSprite.width = tileSize;
                    tileSprite.height = tileSize;

                    const x = centerX + offsetX + (c - minC) * tileSize;
                    // 使用与实际游戏一致的坐标系统：r 增加时 y 减小（向上）
                    const y = centerY + offsetY - (r - minR) * tileSize;
                    tileSprite.position.set(x, y);

                    this.nextShapePreviewContainer.addChild(tileSprite);
                    this.nextShapePreviewTiles[previewIndex].push(tileSprite);
                }
            }
        }
    }
}
