import * as PIXI from 'pixi.js';
import { theme } from './theme.js';

export default class TetrisButton extends PIXI.Container {
    constructor(app, title, callback) {
        super();
        this.app = app;
        this.title = title;
        this.callback = callback;

        this.init();
    }

    init() {
        const buttonTexture = this.app.textures.button;
        if (!buttonTexture) {
            console.warn('button texture not found');
            return;
        }

        this.bgSprite = new PIXI.Sprite(buttonTexture);
        this.bgSprite.anchor.set(0.5, 0.5);
        this.bgSprite.position.set(0, 0);
        this.addChild(this.bgSprite);

        const textStyle = new PIXI.TextStyle({
            fontFamily: theme.fontFamily,
            fontSize: 24,
            fill: 0x000000,
            fontWeight: 'bold',
            align: 'center'
        });

        this.text = new PIXI.Text(this.title, textStyle);
        this.text.anchor.set(0.5, 0.5);
        this.text.position.set(0, 0);
        this.addChild(this.text);

        this.enabledCount = 1;
        this.updateEnabledState();

        this.on('pointerdown', this.onButtonDown.bind(this));
        this.on('pointerup', this.onButtonUp.bind(this));
        this.on('pointerupoutside', this.onButtonUp.bind(this));
        this.on('pointertap', this.onButtonClick.bind(this));
    }

    setEnabled(enabled) {
        if (enabled) {
            this.enabledCount++;
        } else {
            this.enabledCount--;
        }
        this.updateEnabledState();
    }

    updateEnabledState() {
        const isEnabled = this.enabledCount > 0;
        this.eventMode = isEnabled ? 'static' : 'none';
        this.cursor = isEnabled ? 'pointer' : 'default';

        // 置灰效果
        if (this.bgSprite) {
            this.bgSprite.tint = isEnabled ? 0xFFFFFF : 0x808080; // 禁用时置灰
        }
        if (this.text) {
            this.text.style.fill = isEnabled ? 0x000000 : 0x666666; // 文字也变灰
        }
    }

    onButtonDown() {
        this.scale.set(0.9);
    }

    onButtonUp() {
        this.scale.set(1);
    }

    onButtonClick() {
        if (this.callback) {
            this.callback();
        }
    }
}
