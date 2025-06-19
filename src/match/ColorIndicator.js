import * as PIXI from 'pixi.js';

// 颜色指示器类
export default class ColorIndicator extends PIXI.Container {
    constructor(color, collectCount) {
        super();

        this.color = color;
        this.collectCount = collectCount;
        this.currentProgress = 0;

        // 创建圆形背景
        this.background = new PIXI.Graphics();
        this.background.beginFill(color);
        this.background.drawCircle(0, 0, 60);
        this.background.endFill();
        this.addChild(this.background);

        // 创建进度文字
        this.progressText = new PIXI.Text('0/0', {
            fontFamily: 'Arial',
            fontSize: 40,
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.progressText.anchor.set(0.5, 0.5);
        this.addChild(this.progressText);

        // 初始化进度
        this.updateProgress(0);
    }

    // 更新进度
    updateProgress(currentProgress) {
        this.currentProgress = Math.min(currentProgress, this.collectCount);
        this.progressText.text = `${this.currentProgress}/${this.collectCount}`;
    }

    // 播放击中效果
    playHitEffect(result) {
        // 创建缩放动画
        const originalScale = 1.0;

        // 快速放大
        this.scale.set(originalScale * 0.9);

        // 添加发光效果
        const glow = new PIXI.Graphics();
        glow.beginFill(this.color, 0.5);
        glow.drawCircle(0, 0, 70);
        glow.endFill();
        this.addChild(glow);

        // 动画回到原始大小
        setTimeout(() => {
            this.scale.set(originalScale);
            if (this.children.includes(glow)) {
                this.removeChild(glow);
            }
        }, 100);

        this.updateProgress(result.currentScore);
    }
} 