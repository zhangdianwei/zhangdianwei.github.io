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
        card.x = width / 2;
        card.y = height / 2;
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
        title.x = width / 2;
        title.y = height / 2 - 110;
        this.addChild(title);

        // 开始按钮
        const btnWidth = 180;
        const btnHeight = 48;
        const btnY = height / 2 + 90;
        const btn = new PIXI.Graphics();
        btn.beginFill(0x222222, 1);
        btn.drawRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 8);
        btn.endFill();
        btn.x = width / 2;
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
        btnText.x = width / 2;
        btnText.y = btnY;
        btnText.eventMode = 'static';
        btnText.cursor = 'pointer';
        this.addChild(btnText);

        // 支持点击按钮或文字都能触发
        const doStart = () => {
            if (typeof this.onStart === 'function') this.onStart();
            this.visible = false;
            this.destroy({ children: true });
        };
        btn.on('pointertap', doStart);
        btnText.on('pointertap', doStart);
    }
}
