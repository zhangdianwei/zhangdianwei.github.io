import * as PIXI from 'pixi.js';
import ColorIndicator from './ColorIndicator.js';

export default class UIManager {
    constructor(gameApp) {
        this.gameApp = gameApp;
        this.levelInfoUI = null;
        this.levelInfoStaticText = null;
        this.levelColorIndicators = [];
    }

    // 初始化关卡信息UI（关卡加载完成后调用）
    initLevelInfoUI() {
        if (!this.gameApp.levelManager || !this.gameApp.levelManager.currentLevelConfig) {
            return;
        }
        const config = this.gameApp.levelManager.currentLevelConfig;

        // 如果已存在旧的UI容器，先移除
        if (this.levelInfoUI) {
            this.gameApp.ui.removeChild(this.levelInfoUI);
        }
        this.levelInfoUI = new PIXI.Container();
        this.gameApp.ui.addChild(this.levelInfoUI);

        // 创建静态文本（关卡编号）
        this.levelInfoStaticText = new PIXI.Text(`第${config.id}关`, {
            fontFamily: 'Arial',
            fontSize: 66,
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.levelInfoStaticText.x = 0;
        this.levelInfoStaticText.y = 0;
        this.levelInfoStaticText.anchor.set(0.5, 0.5);
        this.levelInfoUI.addChild(this.levelInfoStaticText);

        // 清空颜色指示器数组
        this.levelColorIndicators = [];

        const indicatorWidth = 240;
        const indicatorSpacing = 30;
        const totalWidth = config.colorIndex.length * indicatorWidth + (config.colorIndex.length - 1) * indicatorSpacing;
        const startX = -totalWidth / 2;

        // 添加颜色指示器
        config.colorIndex.forEach((colorIndex, index) => {
            // 创建颜色指示器
            const colorIndicator = new ColorIndicator(this.gameApp.colors[colorIndex], config.collectCount[index]);
            colorIndicator.x = startX + index * (indicatorWidth + indicatorSpacing) + indicatorWidth / 2;
            colorIndicator.y = 120;
            this.levelInfoUI.addChild(colorIndicator);

            // 保存颜色指示器引用
            this.levelColorIndicators.push(colorIndicator);
        });

        // 初始化进度显示
        this.updateLevelProgressUI();

        // 重新计算居中位置
        this.levelInfoUI.x = this.gameApp.pixi.screen.width / 2;
        this.levelInfoUI.y = 120;
    }

    // 更新关卡进度UI（每次收集水滴时调用）
    updateLevelProgressUI() {
        if (!this.levelInfoUI || !this.gameApp.levelManager || !this.gameApp.levelManager.currentLevelConfig) {
            return;
        }

        const config = this.gameApp.levelManager.currentLevelConfig;
        const countByColor = this.gameApp.levelManager.countByColor || {};

        // 更新每个颜色的进度文本
        config.colorIndex.forEach((colorIndex, index) => {
            const currentCount = countByColor[colorIndex] || 0;

            // 更新对应的颜色指示器
            if (this.levelColorIndicators[index]) {
                this.levelColorIndicators[index].updateProgress(currentCount);
            }
        });
    }

    // 播放颜色指示器的击中效果
    playColorIndicatorHitEffect(result) {
        if (this.levelColorIndicators[result.colorIndex]) {
            this.levelColorIndicators[result.colorIndex].playHitEffect(result);
        }
    }

    destroy() {
        if (this.levelInfoUI) {
            this.gameApp.ui.removeChild(this.levelInfoUI);
            this.levelInfoUI = null;
        }
        this.levelColorIndicators = [];
    }
} 