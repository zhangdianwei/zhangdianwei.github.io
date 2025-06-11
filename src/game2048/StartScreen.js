import * as PIXI from 'pixi.js';

export default class StartScreen extends PIXI.Container {
    constructor({ width = 800, height = 600, onStart = null } = {}) {
        super();
        this.eventMode = 'static';
        this.width = width;
        this.height = height;
        this.onStart = onStart;

        // 小卡片背景（黑白灰主题）
        const cardWidth = 420;
        const cardHeight = 340;
        const card = new PIXI.Graphics();
        card.beginFill(0xf6f6f6, 0.98); // 很浅的灰
        card.drawRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 32);
        card.endFill();
        card.x = 0;
        card.y = 0;
        this.addChild(card);

        // 标题
        const title = new PIXI.Text('2048 蛇蛇大作战', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 44,
            fill: 0x222222,
            fontWeight: 'bold',
            align: 'center',
            dropShadow: true,
            dropShadowColor: 0xffffff,
            dropShadowBlur: 8,
        });
        title.anchor.set(0.5);
        title.x = 0;
        title.y = -110;
        this.addChild(title);

        // 开始按钮
        const btnWidth = 180;
        const btnHeight = 48;
        const btnY = 90;
        const btn = new PIXI.Graphics();
        btn.beginFill(0x222222, 1);
        btn.drawRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 8);
        btn.endFill();
        btn.x = 0;
        btn.y = btnY;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        this.addChild(btn);

        const btnText = new PIXI.Text('开始游戏', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 22,
            fill: 0xf6f6f6,
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
        const doStart = () => {
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
                    if (typeof this.onStart === 'function') this.onStart();
                    this.visible = false;
                    this.destroy({ children: true });
                }
            };
            disappearTicker.add(disappearStep);
        };
        btn.on('pointertap', doStart);
        btnText.on('pointertap', doStart);
    }
}
