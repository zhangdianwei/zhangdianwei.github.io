import * as PIXI from 'pixi.js';
import { makeButton } from '../pixi/PixiUI.js';
import { appear, disappear, scaleOnce } from '../pixi/PixiAction.js';

export default class StartScreen extends PIXI.Container {
    constructor({ onStart = null } = {}) {
        super();
        this.eventMode = 'static';
        this.onStart = onStart;
        this.counter = 2;
        this.maxCounter = 128;

        this.createCard();
        this.createTitle();
        this.createCounterButton();
        this.createStartButton();
        appear(this);
    }

    createCard() {
        const cardWidth = 800;
        const cardHeight = 800;
        const card = new PIXI.Graphics();
        card.beginFill(0xf6f6f6, 0.98);
        card.drawRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 32);
        card.endFill();
        card.x = 0;
        card.y = 0;
        this.addChild(card);
        this.cardHeight = cardHeight;
    }

    createTitle() {
        const title = new PIXI.Text('2048 贪吃蛇', {
            fontFamily: 'Arial',
            fontSize: 120,
            fontWeight: 'bold',
            fill: 0xffffff,
            align: 'center',
            dropShadow: true,
            dropShadowColor: '#333',
            dropShadowBlur: 8,
            dropShadowDistance: 4
        });
        title.anchor.set(0.5, 0);
        title.x = 0;
        title.y = -this.cardHeight / 2 + 60;
        this.addChild(title);
    }

    createCounterButton() {
        const descBtnWidth = 240;
        const descBtnHeight = 100;
        
        // 按钮
        const descBtn = new PIXI.Graphics();
        descBtn.beginFill(0xffe066, 1);
        descBtn.drawRoundedRect(-descBtnWidth/2, -descBtnHeight/2, descBtnWidth, descBtnHeight, 24);
        descBtn.endFill();
        descBtn.x = -80;
        descBtn.y = 0;
        descBtn.eventMode = 'static';
        descBtn.cursor = 'pointer';
        descBtn.hitArea = new PIXI.Rectangle(-descBtnWidth/2 - 20, -descBtnHeight/2 - 20, descBtnWidth + 40, descBtnHeight + 40);
        this.addChild(descBtn);

        // 按钮文字（作为按钮的子节点）
        const descBtnText = new PIXI.Text('支持殿伟', {
            fontFamily: 'Arial',
            fontSize: 40,
            fill: 0x333333,
            fontWeight: 'bold',
            align: 'center',
        });
        descBtnText.anchor.set(0.5, 0.5);
        descBtnText.x = 0; // 相对于父节点(descBtn)的位置
        descBtnText.y = 0;
        descBtn.addChild(descBtnText);

        // 计数文本
        this.counterText = new PIXI.Text(this.counter.toString(), {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xffe066,
            fontWeight: 'bold',
            align: 'center',
            dropShadow: true,
            dropShadowColor: '#000',
            dropShadowBlur: 6,
            dropShadowDistance: 2
        });
        this.counterText.anchor.set(0.5, 0.5);
        this.counterText.x = descBtn.x + descBtnWidth/2 + 40;
        this.counterText.y = descBtn.y;
        this.addChild(this.counterText);

        // 按钮点击事件
        const handleClick = () => {
            if (this.counter < this.maxCounter) {
                this.counter *= 2;
                this.counterText.text = this.counter.toString();

                scaleOnce(this.counterText);
            }
        };

        makeButton(descBtn, handleClick);
    }

    createStartButton() {
        const btnWidth = 420;
        const btnHeight = 120;
        
        const startBtn = new PIXI.Graphics();
        startBtn.beginFill(0xff5e5e, 1);
        startBtn.drawRoundedRect(-btnWidth/2, 0, btnWidth, btnHeight, 40);
        startBtn.endFill();
        startBtn.x = 0;
        startBtn.y = this.cardHeight / 2 - btnHeight - 60;
        startBtn.eventMode = 'static';
        startBtn.cursor = 'pointer';
        this.addChild(startBtn);

        // 按钮文字（作为按钮的子节点）
        const btnText = new PIXI.Text('开始游戏', {
            fontFamily: 'Arial',
            fontSize: 64,
            fill: 0xffffff,
            fontWeight: 'bold',
            align: 'center',
        });
        btnText.anchor.set(0.5, 0.5);
        btnText.x = 0; // 相对于父节点(startBtn)的位置
        btnText.y = btnHeight / 2;
        startBtn.addChild(btnText);

        makeButton(startBtn, async () => {
            await disappear(this);
            this.removeFromParent();
            if (this.onStart) this.onStart(this.counter);
        });
    }

}
