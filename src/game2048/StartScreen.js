import * as PIXI from 'pixi.js';
import PlaneEightAnim from './StartScreen.PlaneEightAnim.js';

export default class StartScreen extends PIXI.Container {
    constructor({ onStart = null } = {}) {
        super();
        this.eventMode = 'static';
        this.onStart = onStart;
        this.counter = 1;
        this.maxCounter = 128;

        this.createCard();
        this.createTitle();
        this.createCounterButton();
        this.createStartButton();
        this.setupAnimations();
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
        const descBtnText = new PIXI.Text('爱', {
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
        this.counterText.anchor.set(0, 0.5);
        this.counterText.x = descBtn.x + descBtnWidth/2 + 24;
        this.counterText.y = descBtn.y;
        this.addChild(this.counterText);

        // 按钮点击事件
        const handleClick = () => {
            if (this.counter < this.maxCounter) {
                this.counter *= 2;
                this.counterText.text = this.counter.toString();
                
                // counter更新时的缩放效果
                this.animateCounterUpdate();
            }
        };
        
        // 按钮按下效果（只需要处理父节点）
        const handlePointerDown = () => {
            descBtn.scale.set(0.95);
        };
        
        const handlePointerUp = () => {
            descBtn.scale.set(1);
        };
        
        descBtn.on('click', handleClick);
        descBtn.on('pointerdown', handlePointerDown);
        descBtn.on('pointerup', handlePointerUp);
        descBtn.on('pointerupoutside', handlePointerUp);
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

        // 开始按钮按下效果（只需要处理父节点）
        const handleStartPointerDown = () => {
            startBtn.scale.set(0.95);
        };
        
        const handleStartPointerUp = () => {
            startBtn.scale.set(1);
        };
        
        startBtn.on('pointerdown', handleStartPointerDown);
        startBtn.on('pointerup', handleStartPointerUp);
        startBtn.on('pointerupoutside', handleStartPointerUp);

        // 添加消失动画的点击事件
        const doStart = () => {
            let disappearTicker = PIXI.Ticker.shared;
            let disappearTime = 0;
            const disappearDuration = 0.18;
            const disappearStep = (delta) => {
                disappearTime += disappearTicker.deltaMS / 1000;
                let t = Math.min(disappearTime / disappearDuration, 1);
                let s = 1 - this.easeInBack(t);
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
        startBtn.on('click', doStart);
    }

    setupAnimations() {
        // backIn/backOut 缓动函数
        this.easeOutBack = (t) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        };
        
        this.easeInBack = (t) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return c3 * t * t * t - c1 * t * t;
        };

        // appear动画（backOut）
        this.scale.set(0);
        let appearTicker = PIXI.Ticker.shared;
        let appearTime = 0;
        const appearDuration = 0.28;
        const appearStep = (delta) => {
            appearTime += appearTicker.deltaMS / 1000;
            let t = Math.min(appearTime / appearDuration, 1);
            let s = this.easeOutBack(t);
            this.scale.set(s);
            if (t >= 1) {
                appearTicker.remove(appearStep);
                this.scale.set(1);
            }
        };
        appearTicker.add(appearStep);
    }

    animateCounterUpdate() {
        // counter更新时的缩放动画
        const originalScale = 1;
        this.counterText.scale.set(originalScale * 1.1);
        
        // 使用Ticker创建动画
        let ticker = PIXI.Ticker.shared;
        let time = 0;
        const duration = 0.2;
        
        const animate = (delta) => {
            time += ticker.deltaMS / 1000;
            let t = Math.min(time / duration, 1);
            
            // 使用easeOutBack缓动
            let scale = originalScale * (1 + 0.3 * this.easeOutBack(1 - t));
            this.counterText.scale.set(scale);
            
            if (t >= 1) {
                ticker.remove(animate);
                this.counterText.scale.set(originalScale);
            }
        };
        
        ticker.add(animate);
    }
}
