import * as PIXI from 'pixi.js';
import { getLevelConfig, getAllLevelConfigs } from './LevelConfig.js';

export default class SettlementManager {
    constructor(gameApp) {
        this.gameApp = gameApp;
        this.container = null;
        this.isVisible = false;
        this.settlementData = null;

        this.initSettlementContainer();
    }

    /**
     * 初始化结算界面容器
     */
    initSettlementContainer() {
        this.container = new PIXI.Container();
        this.container.visible = false;
        this.container.zIndex = 1000; // 确保在最上层
        this.gameApp.pixi.stage.addChild(this.container);
    }

    /**
     * 显示结算界面
     * @param {Object} data - 结算数据
     */
    showSettlement(data) {
        this.settlementData = data;
        this.isVisible = true;

        // 清除之前的界面
        this.clearSettlement();

        // 创建结算界面
        this.createSettlementUI();

        // 显示容器
        this.container.visible = true;

        // 播放显示动画
        this.playShowAnimation();
    }

    /**
     * 隐藏结算界面
     */
    hideSettlement() {
        this.isVisible = false;
        this.container.visible = false;
        this.clearSettlement();
    }

    /**
     * 清除结算界面
     */
    clearSettlement() {
        // 移除所有子元素
        while (this.container.children.length > 0) {
            this.container.removeChildAt(0);
        }
    }

    /**
     * 创建结算界面UI
     */
    createSettlementUI() {
        const screenWidth = this.gameApp.pixi.screen.width;
        const screenHeight = this.gameApp.pixi.screen.height;

        // 第一步：计算所有元素的位置
        this.calculateElementPositions(screenWidth, screenHeight);

        // 第二步：根据计算结果创建UI元素
        this.createBackgroundMask(screenWidth, screenHeight);
        this.createMainPanel();
        this.createTitle();
        this.createResultInfo();
        this.createButtons();

        // 第三步：开始播放动画序列
        this.playAnimationSequence();
    }

    /**
     * 计算所有元素的位置
     */
    calculateElementPositions(screenWidth, screenHeight) {
        const colorCount = this.settlementData.levelConfig.colorIndex.length;

        // 根据颜色数量动态计算面板尺寸
        const basePanelHeight = 600; // 基础面板高度
        const colorItemHeight = 90; // 每个颜色项高度
        const colorItemSpacing = 20; // 颜色项间距
        const totalColorHeight = colorCount * (colorItemHeight + colorItemSpacing);
        const dynamicPanelHeight = basePanelHeight + totalColorHeight;

        // 面板尺寸和位置
        this.panelConfig = {
            width: Math.max(800, 600 + colorCount * 50), // 根据颜色数量调整宽度
            height: Math.max(1000, dynamicPanelHeight),
            x: (screenWidth - Math.max(800, 600 + colorCount * 50)) / 2,
            y: (screenHeight - Math.max(1000, dynamicPanelHeight)) / 2
        };

        // 根据颜色数量动态调整字体大小
        this.fontConfig = {
            title: Math.max(72, 96 - (colorCount - 2) * 8), // 标题字体
            levelInfo: Math.max(36, 48 - (colorCount - 2) * 4), // 关卡信息字体
            score: Math.max(48, 64 - (colorCount - 2) * 6), // 分数字体
            colorTitle: Math.max(40, 52 - (colorCount - 2) * 4), // 颜色收集标题字体
            colorCount: Math.max(36, 48 - (colorCount - 2) * 4), // 颜色数量字体
            colorScore: Math.max(32, 44 - (colorCount - 2) * 4), // 颜色分数字体
            button: Math.max(28, 36 - (colorCount - 2) * 2), // 按钮字体
            colorIndicator: Math.max(20, 30 - (colorCount - 2) * 2), // 颜色指示器半径
            buttonWidth: Math.max(240, 280 - (colorCount - 2) * 10), // 按钮宽度
            buttonHeight: Math.max(70, 90 - (colorCount - 2) * 5) // 按钮高度
        };

        // 标题位置 - 根据面板高度动态调整
        this.titleConfig = {
            x: this.panelConfig.x + this.panelConfig.width / 2, // 相对于面板居中
            y: this.panelConfig.y + 50
        };

        // 信息容器位置 - 根据标题位置动态调整
        this.infoContainerConfig = {
            x: this.panelConfig.x + this.panelConfig.width / 2, // 相对于面板居中
            y: this.titleConfig.y + 120
        };

        // 关卡信息位置
        this.levelInfoConfig = {
            y: 0
        };

        // 分数信息位置
        this.scoreInfoConfig = {
            y: 80
        };

        // 颜色收集信息位置
        this.colorCollectionConfig = {
            y: 180
        };

        // 计算颜色项位置
        this.calculateColorItemPositions();

        // 计算按钮位置
        this.calculateButtonPositions(screenWidth, screenHeight);
    }

    /**
     * 计算颜色项位置
     */
    calculateColorItemPositions() {
        const colorCount = this.settlementData.levelConfig.colorIndex.length;
        this.colorItemConfigs = [];

        // 根据颜色数量动态调整间距
        const baseSpacing = 90;
        const minSpacing = 70;
        const maxSpacing = 120;
        const dynamicSpacing = Math.max(minSpacing, Math.min(maxSpacing, baseSpacing - (colorCount - 2) * 5));

        let yOffset = 100; // 标题后的起始位置

        for (let i = 0; i < colorCount; i++) {
            // 根据颜色数量动态调整水平位置
            const colorIndicatorX = -220 - (colorCount > 3 ? (colorCount - 3) * 20 : 0);
            const collectTextX = -60 - (colorCount > 3 ? (colorCount - 3) * 10 : 0);
            const scoreTextX = 140 + (colorCount > 3 ? (colorCount - 3) * 10 : 0);

            this.colorItemConfigs.push({
                y: yOffset,
                colorIndicator: { x: colorIndicatorX, y: yOffset },
                collectText: { x: collectTextX, y: yOffset },
                scoreText: { x: scoreTextX, y: yOffset }
            });
            yOffset += dynamicSpacing;
        }
    }

    /**
     * 计算按钮位置
     */
    calculateButtonPositions(screenWidth, screenHeight) {
        const colorCount = this.settlementData.levelConfig.colorIndex.length;

        // 根据颜色数量动态计算按钮位置
        const baseY = this.panelConfig.y + this.panelConfig.height - 150; // 面板底部留出空间
        const colorHeight = 90;
        const colorSpacing = 20;
        const totalColorHeight = colorCount * (colorHeight + colorSpacing);

        // 按钮位置 = 面板底部 - 按钮区域高度
        const buttonAreaHeight = 120; // 按钮区域高度
        const buttonY = baseY - buttonAreaHeight;

        // 根据按钮大小动态调整水平位置
        const buttonSpacing = this.fontConfig.buttonWidth + 40; // 按钮间距

        this.buttonConfig = {
            x: this.panelConfig.x + this.panelConfig.width / 2, // 相对于面板居中
            y: buttonY,
            restartButton: { x: -buttonSpacing / 2 },
            nextButton: { x: buttonSpacing / 2 }
        };
    }

    /**
     * 创建背景遮罩
     */
    createBackgroundMask(screenWidth, screenHeight) {
        const background = new PIXI.Graphics();
        background.beginFill(0x000000, 0.7);
        background.drawRect(0, 0, screenWidth, screenHeight);
        background.endFill();
        background.eventMode = 'static'

        // 点击背景不关闭界面
        background.on('pointerdown', () => {
            // 防止事件冒泡
        });

        this.container.addChild(background);
    }

    /**
     * 创建主面板
     */
    createMainPanel() {
        const panel = new PIXI.Graphics();

        // 绘制面板背景
        panel.beginFill(0x2C3E50, 0.95);
        panel.lineStyle(4, 0x3498DB, 1);
        panel.drawRoundedRect(this.panelConfig.x, this.panelConfig.y, this.panelConfig.width, this.panelConfig.height, 20);
        panel.endFill();

        // 添加渐变效果
        const gradient = new PIXI.Graphics();
        gradient.beginFill(0x3498DB, 0.3);
        gradient.drawRoundedRect(this.panelConfig.x + 10, this.panelConfig.y + 10, this.panelConfig.width - 20, 80, 15);
        gradient.endFill();

        this.container.addChild(panel);
        this.container.addChild(gradient);
    }

    /**
     * 创建标题
     */
    createTitle() {
        const titleText = this.settlementData.isWin ? '关卡完成！' : '游戏结束';
        const titleColor = this.settlementData.isWin ? 0x2ECC71 : 0xE74C3C;

        const title = new PIXI.Text(titleText, {
            fontFamily: 'Arial',
            fontSize: this.fontConfig.title,
            fontWeight: 'bold',
            fill: titleColor,
            stroke: 0xFFFFFF,
            strokeThickness: 3,
            align: 'center'
        });

        title.anchor.set(0.5, 0); // 设置锚点为(0.5, 0)
        title.x = this.titleConfig.x;
        title.y = this.titleConfig.y;

        this.container.addChild(title);
    }

    /**
     * 创建结果信息
     */
    createResultInfo() {
        const infoContainer = new PIXI.Container();
        infoContainer.x = this.infoContainerConfig.x;
        infoContainer.y = this.infoContainerConfig.y;

        // 关卡信息
        const levelInfo = new PIXI.Text(`关卡 ${this.settlementData.levelId}: ${this.settlementData.levelName}`, {
            fontFamily: 'Arial',
            fontSize: this.fontConfig.levelInfo,
            fill: 0xFFFFFF,
            align: 'center'
        });
        levelInfo.anchor.set(0.5, 0);
        levelInfo.y = this.levelInfoConfig.y;
        infoContainer.addChild(levelInfo);

        // 分数信息（初始隐藏）
        const scoreText = new PIXI.Text(`得分: ${this.settlementData.currentScore}`, {
            fontFamily: 'Arial',
            fontSize: this.fontConfig.score,
            fontWeight: 'bold',
            fill: 0xF39C12,
            align: 'center'
        });
        scoreText.anchor.set(0.5, 0);
        scoreText.y = this.scoreInfoConfig.y;
        scoreText.alpha = 0; // 初始隐藏
        infoContainer.addChild(scoreText);

        // 颜色收集信息（初始隐藏）
        const colorContainer = this.createColorCollectionInfo();
        colorContainer.alpha = 0; // 初始隐藏
        infoContainer.addChild(colorContainer);

        // 保存引用用于动画
        this.animationElements = {
            scoreText,
            colorContainer
        };

        this.container.addChild(infoContainer);
    }

    /**
     * 创建颜色收集信息
     */
    createColorCollectionInfo() {
        const colorContainer = new PIXI.Container();
        colorContainer.y = this.colorCollectionConfig.y;

        const title = new PIXI.Text('收集进度:', {
            fontFamily: 'Arial',
            fontSize: this.fontConfig.colorTitle,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center'
        });
        title.anchor.set(0.5, 0);
        colorContainer.addChild(title);

        const colors = this.gameApp.colors;

        // 保存颜色元素用于动画
        this.colorElements = [];

        // 遍历关卡配置中的颜色索引
        this.settlementData.levelConfig.colorIndex.forEach((colorIndex, index) => {
            const color = colors[colorIndex];
            const count = this.settlementData.countByColor[colorIndex] || 0;
            const target = this.settlementData.targetCounts[index];
            const score = this.settlementData.scoreByColor[colorIndex] || 0;
            const config = this.colorItemConfigs[index];

            const colorElement = new PIXI.Container();
            colorElement.alpha = 0; // 初始隐藏

            // 颜色指示器
            const colorIndicator = new PIXI.Graphics();
            colorIndicator.beginFill(color);
            colorIndicator.drawCircle(0, 0, this.fontConfig.colorIndicator);
            colorIndicator.endFill();
            colorIndicator.x = config.colorIndicator.x;
            colorIndicator.y = config.colorIndicator.y;

            // 收集文本
            const collectText = new PIXI.Text(`${count}/${target}`, {
                fontFamily: 'Arial',
                fontSize: this.fontConfig.colorCount,
                fill: count >= target ? 0x2ECC71 : 0xFFFFFF,
                align: 'center'
            });
            collectText.anchor.set(0.5, 0.5);
            collectText.x = config.collectText.x;
            collectText.y = config.collectText.y;

            // 分数文本
            const scoreText = new PIXI.Text(`+${score}`, {
                fontFamily: 'Arial',
                fontSize: this.fontConfig.colorScore,
                fill: 0xF39C12,
                align: 'center'
            });
            scoreText.anchor.set(0.5, 0.5);
            scoreText.x = config.scoreText.x;
            scoreText.y = config.scoreText.y;

            colorElement.addChild(colorIndicator);
            colorElement.addChild(collectText);
            colorElement.addChild(scoreText);
            colorContainer.addChild(colorElement);

            this.colorElements.push(colorElement);
        });

        return colorContainer;
    }

    /**
     * 创建按钮
     */
    createButtons() {
        const buttonContainer = new PIXI.Container();
        buttonContainer.x = this.buttonConfig.x;
        buttonContainer.y = this.buttonConfig.y;
        buttonContainer.alpha = 0; // 初始隐藏

        // 重新开始按钮
        const restartButton = this.createButton('重新开始', 0xE74C3C, () => {
            this.onRestartClick();
        });
        restartButton.x = this.buttonConfig.restartButton.x;
        buttonContainer.addChild(restartButton);

        // 下一关按钮（仅在胜利时显示）
        const totalLevelCount = getAllLevelConfigs().length;
        if (this.settlementData.isWin && this.settlementData.levelId < totalLevelCount) {
            const nextButton = this.createButton('下一关', 0x2ECC71, () => {
                this.onNextLevelClick();
            });
            nextButton.x = this.buttonConfig.nextButton.x;
            buttonContainer.addChild(nextButton);
        }

        this.buttonContainer = buttonContainer;
        this.container.addChild(buttonContainer);
    }

    /**
     * 创建按钮
     */
    createButton(text, color, onClick) {
        const button = new PIXI.Container();
        button.eventMode = 'static'

        // 按钮背景
        const background = new PIXI.Graphics();
        background.beginFill(color);
        background.lineStyle(3, 0xFFFFFF, 1); // 增大边框
        background.drawRoundedRect(
            -this.fontConfig.buttonWidth / 2,
            -this.fontConfig.buttonHeight / 2,
            this.fontConfig.buttonWidth,
            this.fontConfig.buttonHeight,
            20
        );
        background.endFill();

        // 按钮文本
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: this.fontConfig.button,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center'
        });
        buttonText.anchor.set(0.5, 0.5);

        button.addChild(background);
        button.addChild(buttonText);

        // 添加交互效果
        button.on('pointerdown', onClick);
        button.on('pointerover', () => {
            background.tint = 0xCCCCCC;
        });
        button.on('pointerout', () => {
            background.tint = 0xFFFFFF;
        });

        return button;
    }

    /**
     * 播放动画序列
     */
    playAnimationSequence() {
        // 第一步：播放出现动画
        this.playShowAnimation(() => {
            // 第二步：依次播放每种颜色收集的数量和分数
            this.playColorAnimations(() => {
                // 第三步：显示总数量和总分数
                this.playTotalAnimations(() => {
                    // 第四步：显示下一关按钮
                    this.showButtons();
                });
            });
        });
    }

    /**
     * 播放显示动画
     */
    playShowAnimation(callback) {
        // 设置初始状态
        this.container.alpha = 0;
        this.container.scale.set(0.8);

        // 创建动画
        let progress = 0;
        const animate = () => {
            progress += 0.08; // 加快动画速度

            if (progress >= 1) {
                progress = 1;
                this.gameApp.pixi.ticker.remove(animate);
                if (callback) callback();
            }

            // 缓动函数
            const easeOut = 1 - Math.pow(1 - progress, 3);

            this.container.alpha = easeOut;
            this.container.scale.set(0.8 + (1 - 0.8) * easeOut);
        };

        this.gameApp.pixi.ticker.add(animate);
    }

    /**
     * 播放颜色动画
     */
    playColorAnimations(callback) {
        let currentIndex = 0;

        const playNextColor = () => {
            if (currentIndex >= this.colorElements.length) {
                if (callback) callback();
                return;
            }

            const colorElement = this.colorElements[currentIndex];
            colorElement.alpha = 0;
            colorElement.scale.set(0.5);

            // 播放单个颜色的动画
            let progress = 0;
            const animate = () => {
                progress += 0.15; // 加快动画速度

                if (progress >= 1) {
                    progress = 1;
                    this.gameApp.pixi.ticker.remove(animate);
                    currentIndex++;
                    setTimeout(playNextColor, 100); // 缩短延迟时间
                }

                const easeOut = 1 - Math.pow(1 - progress, 2);
                colorElement.alpha = easeOut;
                colorElement.scale.set(0.5 + (1 - 0.5) * easeOut);
            };

            this.gameApp.pixi.ticker.add(animate);
        };

        playNextColor();
    }

    /**
     * 播放总计动画
     */
    playTotalAnimations(callback) {
        // 显示分数
        if (this.animationElements.scoreText) {
            this.animationElements.scoreText.alpha = 0;
            this.animationElements.scoreText.scale.set(0.8);

            let progress = 0;
            const animateScore = () => {
                progress += 0.12; // 加快动画速度

                if (progress >= 1) {
                    progress = 1;
                    this.gameApp.pixi.ticker.remove(animateScore);

                    // 显示颜色容器
                    this.animationElements.colorContainer.alpha = 0;
                    this.animationElements.colorContainer.scale.set(0.8);

                    let colorProgress = 0;
                    const animateColor = () => {
                        colorProgress += 0.12; // 加快动画速度

                        if (colorProgress >= 1) {
                            colorProgress = 1;
                            this.gameApp.pixi.ticker.remove(animateColor);
                            if (callback) callback();
                        }

                        const easeOut = 1 - Math.pow(1 - colorProgress, 2);
                        this.animationElements.colorContainer.alpha = easeOut;
                        this.animationElements.colorContainer.scale.set(0.8 + (1 - 0.8) * easeOut);
                    };

                    this.gameApp.pixi.ticker.add(animateColor);
                }

                const easeOut = 1 - Math.pow(1 - progress, 2);
                this.animationElements.scoreText.alpha = easeOut;
                this.animationElements.scoreText.scale.set(0.8 + (1 - 0.8) * easeOut);
            };

            this.gameApp.pixi.ticker.add(animateScore);
        } else {
            if (callback) callback();
        }
    }

    /**
     * 显示按钮
     */
    showButtons() {
        if (this.buttonContainer) {
            this.buttonContainer.alpha = 0;
            this.buttonContainer.scale.set(0.8);

            let progress = 0;
            const animate = () => {
                progress += 0.12; // 加快动画速度

                if (progress >= 1) {
                    progress = 1;
                    this.gameApp.pixi.ticker.remove(animate);
                }

                const easeOut = 1 - Math.pow(1 - progress, 2);
                this.buttonContainer.alpha = easeOut;
                this.buttonContainer.scale.set(0.8 + (1 - 0.8) * easeOut);
            };

            this.gameApp.pixi.ticker.add(animate);
        }
    }

    /**
     * 重新开始按钮点击事件
     */
    onRestartClick() {
        this.hideSettlement();
        this.gameApp.levelManager.loadLevel(this.settlementData.levelId);
    }

    /**
     * 下一关按钮点击事件
     */
    onNextLevelClick() {
        this.hideSettlement();
        const nextLevelId = this.settlementData.levelId + 1;
        this.gameApp.levelManager.loadLevel(nextLevelId);
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.hideSettlement();
        if (this.container && this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
        this.container = null;
    }
} 