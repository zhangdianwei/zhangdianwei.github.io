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

    stopAllTween() {
        if (this.moveTween) {
            this.moveTween.stop();
            this.moveTween = null;
        }
        if (this.scaleTween) {
            this.scaleTween.stop();
            this.scaleTween = null;
        }
    }

    animateToTarget(target, duration, onComplete = null) {
        // 停止所有正在进行的动画
        this.stopAllTween();
        
        if (!target) {
            if (onComplete) onComplete();
            return;
        }
        
        const hasPos = target.pos !== undefined;
        const hasScale = target.scale !== undefined;
        
        let completedAnimations = 0;
        const totalAnimations = (hasPos ? 1 : 0) + (hasScale ? 1 : 0);
        
        if (totalAnimations === 0) {
            if (onComplete) onComplete();
            return;
        }
        
        const checkAllComplete = () => {
            completedAnimations++;
            if (completedAnimations >= totalAnimations && onComplete) {
                onComplete();
            }
        };
        
        // 创建位置动画
        if (hasPos) {
            const startX = this.position.x;
            const startY = this.position.y;
            const animObj = { x: startX, y: startY };
            
            const tween = new TWEEN.Tween(animObj)
                .to(target.pos, duration)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    this.position.x = animObj.x;
                    this.position.y = animObj.y;
                })
                .onComplete(() => {
                    this.moveTween = null;
                    checkAllComplete();
                })
                .start();
            
            this.moveTween = tween;
        }
        
        // 创建缩放动画
        if (hasScale) {
            const startScaleX = this.scale.x || 1;
            const startScaleY = this.scale.y !== undefined ? this.scale.y : startScaleX;
            const scaleObj = { x: startScaleX, y: startScaleY };
            
            // 如果 scale 是数字，同时应用到 x 和 y
            let targetScaleX, targetScaleY;
            if (typeof target.scale === 'number') {
                targetScaleX = target.scale;
                targetScaleY = target.scale;
            } else {
                targetScaleX = target.scale.x !== undefined ? target.scale.x : startScaleX;
                targetScaleY = target.scale.y !== undefined ? target.scale.y : targetScaleX;
            }
            
            const scaleTween = new TWEEN.Tween(scaleObj)
                .to({ x: targetScaleX, y: targetScaleY }, duration)
                .easing(TWEEN.Easing.Quadratic.In)
                .onUpdate(() => {
                    this.scale.set(scaleObj.x, scaleObj.y);
                })
                .onComplete(() => {
                    this.scaleTween = null;
                    checkAllComplete();
                })
                .start();
            
            this.scaleTween = scaleTween;
        }
    }
    
    animateToPosition(targetPos, moveAnimationDuration) {
        // 保持向后兼容
        this.animateToTarget({ pos: targetPos }, moveAnimationDuration);
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