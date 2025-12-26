import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';

export default class TetrisTile extends PIXI.Container {
    constructor(game, colorIndex) {
        super();
        this.game = game;
        this.colorIndex = colorIndex;

        let textureUrl = 'tetris/tile' + (colorIndex+1) + '.png';
        let texture = this.game.textures[textureUrl];
        this.image = new PIXI.Sprite(texture);
        this.image.anchor.set(0.5, 0.5);
        this.addChild(this.image);
    }

    get MoveTween() {return this.moveTween;}
    set MoveTween(tween) {this.moveTween = tween;}

    animateToPosition(targetPos, moveAnimationDuration) {
        // 如果 tile 已经有正在进行的移动动画，先停止它
        if (this.MoveTween) {
            this.MoveTween.stop();
            this.MoveTween = null;
        }
        
        // 记录起始位置
        const startX = this.position.x;
        const startY = this.position.y;
        
        // 创建动画对象
        const animObj = { x: startX, y: startY };
        
        // 创建 TWEEN 动画
        const tween = new TWEEN.Tween(animObj)
            .to(targetPos, moveAnimationDuration)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                this.position.x = animObj.x;
                this.position.y = animObj.y;
            })
            .onComplete(() => {
                // 清除 tile 的 moveTween 引用
                this.MoveTween = null;
            })
            .start();
        
        // 将 tween 保存到 tile 上
        this.MoveTween = tween;
    }

}