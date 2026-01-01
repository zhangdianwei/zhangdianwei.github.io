import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';

export default class TetrisTile extends PIXI.Container {
    constructor(game, colorIndex) {
        super();
        this.game = game;
    }

    init(gameUserView, colorIndex) {
        this.colorIndex = colorIndex;
        this.gameUserView = gameUserView;
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

    playBreakAnim() {
        const animDuration = 600; // 动画持续时间（毫秒）
        const minDistance = 40; // 最小炸裂距离
        const maxDistance = 100; // 最大炸裂距离
        const fragmentCount = 6; // 碎片数量

        const startX = this.position.x;
        const startY = this.position.y;

        // 获取纹理
        const textureUrl = 'tetris/tile' + (this.colorIndex + 1) + '.png';
        const texture = this.game.textures[textureUrl];

        // 创建多个碎片，每个碎片有随机的方向和属性
        for (let i = 0; i < fragmentCount; i++) {
            // 随机角度（0 到 2π）
            const angle = Math.random() * Math.PI * 2;
            
            // 随机距离
            const distance = minDistance + Math.random() * (maxDistance - minDistance);
            
            // 计算目标位置
            const targetX = startX + Math.cos(angle) * distance;
            const targetY = startY + Math.sin(angle) * distance;
            
            // 随机旋转速度（度/毫秒）
            const rotationSpeed = (Math.random() - 0.5) * 0.01;
            
            // 随机缩放（0.6 到 1.0）
            const startScale = 0.6 + Math.random() * 0.4;
            const endScale = startScale * 0.3;
            
            // 随机动画时长（让碎片消失时间不同）
            const duration = animDuration * (0.7 + Math.random() * 0.6);

            // 从缓存池获取粒子
            const sprite = this.gameUserView.getParticle(texture);
            sprite.x = startX;
            sprite.y = startY;
            sprite.alpha = 1;
            sprite.scale.set(startScale);
            sprite.rotation = Math.random() * Math.PI * 2; // 初始随机旋转
            this.gameUserView.addChild(sprite);

            // 创建动画对象
            const animObj = {
                x: startX,
                y: startY,
                alpha: 1,
                scale: startScale,
                rotation: sprite.rotation
            };

            // 创建 TWEEN 动画
            const tween = new TWEEN.Tween(animObj)
                .to({ 
                    x: targetX, 
                    y: targetY, 
                    alpha: 0,
                    scale: endScale,
                    rotation: sprite.rotation + rotationSpeed * duration
                }, duration)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    sprite.x = animObj.x;
                    sprite.y = animObj.y;
                    sprite.alpha = animObj.alpha;
                    sprite.scale.set(animObj.scale);
                    sprite.rotation = animObj.rotation;
                })
                .onComplete(() => {
                    // 归还粒子到缓存池
                    this.gameUserView.returnParticle(sprite);
                })
                .start();
        }
    }

}