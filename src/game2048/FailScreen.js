import * as PIXI from 'pixi.js';

export default class FailScreen extends PIXI.Container {
    constructor({ width = 800, height = 600, onRestart = null } = {}) {
        super();
        this.eventMode = 'static';
        this.width = width;
        this.height = height;
        this.onRestart = onRestart;

        // 半透明遮罩
        const mask = new PIXI.Graphics();
        mask.beginFill(0x000000, 0.6);
        mask.drawRect(0, 0, width, height);
        mask.endFill();
        this.addChild(mask);

        // 卡片背景
        const cardWidth = 420;
        const cardHeight = 240;
        const card = new PIXI.Graphics();
        card.beginFill(0xffffff, 0.98);
        card.drawRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 32);
        card.endFill();
        card.x = 0;
        card.y = 0;
        this.addChild(card);

        // 失败文字
        const title = new PIXI.Text('游戏失败', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 48,
            fill: 0x222222,
            align: 'center',
        });
        title.anchor.set(0.5);
        title.x = 0;
        title.y = -40;
        this.addChild(title);

        // 重新开始按钮
        const btnWidth = 180;
        const btnHeight = 60;
        const btnY = 40;
        const btn = new PIXI.Graphics();
        btn.beginFill(0x2d8cf0, 1);
        btn.drawRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 18);
        btn.endFill();
        btn.x = 0;
        btn.y = btnY;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        this.addChild(btn);

        const btnText = new PIXI.Text('重新开始', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 28,
            fill: 0xffffff,
            align: 'center',
        });
        btnText.anchor.set(0.5);
        btnText.x = 0;
        btnText.y = btnY;
        btnText.eventMode = 'static';
        btnText.cursor = 'pointer';
        this.addChild(btnText);

        // backIn/backOut 缓动函数
        function easeOutBack(t) {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
        function easeInBack(t) {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return c3 * t * t * t - c1 * t * t;
        }

        // appear动画（backOut）
        this.scale.set(0);
        let appearTicker = PIXI.Ticker.shared;
        let appearTime = 0;
        const appearDuration = 0.28;
        const appearStep = (delta) => {
            appearTime += appearTicker.deltaMS / 1000;
            let t = Math.min(appearTime / appearDuration, 1);
            let s = easeOutBack(t);
            this.scale.set(s);
            if (t >= 1) {
                appearTicker.remove(appearStep);
                this.scale.set(1);
            }
        };
        appearTicker.add(appearStep);

        // disappear动画（backIn）
        const doRestart = () => {
            let disappearTicker = PIXI.Ticker.shared;
            let disappearTime = 0;
            const disappearDuration = 0.18;
            const disappearStep = (delta) => {
                disappearTime += disappearTicker.deltaMS / 1000;
                let t = Math.min(disappearTime / disappearDuration, 1);
                let s = 1 - easeInBack(t);
                this.scale.set(Math.max(s, 0));
                if (t >= 1) {
                    disappearTicker.remove(disappearStep);
                    this.scale.set(0);
                    if (typeof this.onRestart === 'function') this.onRestart();
                    this.visible = false;
                    this.destroy({ children: true });
                }
            };
            disappearTicker.add(disappearStep);
        };
        btn.on('pointertap', doRestart);
        btnText.on('pointertap', doRestart);
    }
}
