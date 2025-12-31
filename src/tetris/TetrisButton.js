import * as PIXI from 'pixi.js';

export default class TetrisButton extends PIXI.Container {
    constructor(game, title, callback) {
        super();
        this.game = game;
        this.title = title;
        this.callback = callback;
        
        this.init();
    }
    
    init() {
        const buttonTexture = this.game.textures['tetris/button.png'];
        if (!buttonTexture) {
            console.warn('button.png texture not found');
            return;
        }
        
        this.bgSprite = new PIXI.Sprite(buttonTexture);
        this.bgSprite.anchor.set(0.5, 0.5);
        this.bgSprite.position.set(0, 0);
        this.addChild(this.bgSprite);
        
        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Comic Sans MS, Marker Felt, Chalkduster, cursive',
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
        
        this.on('touchstart', this.onButtonDown.bind(this));
        this.on('touchend', this.onButtonUp.bind(this));
        this.on('touchendoutside', this.onButtonUp.bind(this));
        this.on('tap', this.onButtonClick.bind(this));
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

