import * as TWEEN from '@tweenjs/tween.js';

// 缩放动画
export function scaleTo(obj, duration, targetScale, ease = TWEEN.Easing.Back.Out) {
    return new Promise((resolve) => {
        new TWEEN.Tween(obj.scale)
            .to({ x: targetScale, y: targetScale }, duration * 1000)
            .easing(ease)
            .onComplete(() => resolve())
            .start();
    });
}

// 移动动画
export function moveTo(obj, duration, targetX, targetY, ease = TWEEN.Easing.Quadratic.InOut) {
    return new Promise((resolve) => {
        new TWEEN.Tween(obj)
            .to({ x: targetX, y: targetY }, duration * 1000)
            .easing(ease)
            .onComplete(() => resolve())
            .start();
    });
}

// 放大后回弹效果
export function scaleBounce(obj, duration = 0.3, maxScale = 1.2) {
    return new Promise((resolve) => {
        const originalScale = obj.scale.x;
        
        new TWEEN.Tween(obj.scale)
            .to({ x: maxScale, y: maxScale }, duration * 500)
            .easing(TWEEN.Easing.Back.Out)
            .chain(
                new TWEEN.Tween(obj.scale)
                    .to({ x: originalScale, y: originalScale }, duration * 500)
                    .easing(TWEEN.Easing.Bounce.Out)
                    .onComplete(() => resolve())
            )
            .start();
    });
}

// 脉冲效果（连续放大缩小）
export function pulse(obj, duration = 0.5, scaleRange = 0.1) {
    return new Promise((resolve) => {
        const originalScale = obj.scale.x;
        
        new TWEEN.Tween({ scale: 1 })
            .to({ scale: 1 + scaleRange }, duration * 500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate((coords) => {
                obj.scale.set(originalScale * coords.scale);
            })
            .chain(
                new TWEEN.Tween({ scale: 1 + scaleRange })
                    .to({ scale: 1 }, duration * 500)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .onUpdate((coords) => {
                        obj.scale.set(originalScale * coords.scale);
                    })
                    .onComplete(() => resolve())
            )
            .start();
    });
}

// 旋转动画
export function rotateTo(obj, duration, targetRotation, ease = TWEEN.Easing.Quadratic.InOut) {
    return new Promise((resolve) => {
        new TWEEN.Tween(obj)
            .to({ rotation: targetRotation }, duration * 1000)
            .easing(ease)
            .onComplete(() => resolve())
            .start();
    });
}

// 淡入淡出动画
export function fadeTo(obj, duration, targetAlpha, ease = TWEEN.Easing.Quadratic.InOut) {
    return new Promise((resolve) => {
        new TWEEN.Tween(obj)
            .to({ alpha: targetAlpha }, duration * 1000)
            .easing(ease)
            .onComplete(() => resolve())
            .start();
    });
}

// 组合动画：缩放+移动
export function scaleAndMove(obj, duration, targetScale, targetX, targetY) {
    return new Promise((resolve) => {
        const scaleTween = new TWEEN.Tween(obj.scale)
            .to({ x: targetScale, y: targetScale }, duration * 1000)
            .easing(TWEEN.Easing.Back.Out);
            
        const moveTween = new TWEEN.Tween(obj)
            .to({ x: targetX, y: targetY }, duration * 1000)
            .easing(TWEEN.Easing.Quadratic.InOut);
            
        // 同时开始两个动画
        scaleTween.start();
        moveTween.start();
        
        // 当两个动画都完成时resolve
        let completedCount = 0;
        const checkComplete = () => {
            completedCount++;
            if (completedCount === 2) resolve();
        };
        
        scaleTween.onComplete(checkComplete);
        moveTween.onComplete(checkComplete);
    });
}

// 弹性缩放效果
export function elasticScale(obj, duration, targetScale) {
    return new Promise((resolve) => {
        new TWEEN.Tween(obj.scale)
            .to({ x: targetScale, y: targetScale }, duration * 1000)
            .easing(TWEEN.Easing.Elastic.Out)
            .onComplete(() => resolve())
            .start();
    });
}

// 弹跳移动效果
export function bounceMove(obj, duration, targetX, targetY) {
    return new Promise((resolve) => {
        new TWEEN.Tween(obj)
            .to({ x: targetX, y: targetY }, duration * 1000)
            .easing(TWEEN.Easing.Bounce.Out)
            .onComplete(() => resolve())
            .start();
    });
}

// 循环脉冲效果
export function loopPulse(obj, scaleRange = 0.1) {
    const originalScale = obj.scale.x;
    
    function createPulseTween() {
        return new TWEEN.Tween({ scale: 1 })
            .to({ scale: 1 + scaleRange }, 500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate((coords) => {
                obj.scale.set(originalScale * coords.scale);
            })
            .chain(
                new TWEEN.Tween({ scale: 1 + scaleRange })
                    .to({ scale: 1 }, 500)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .onUpdate((coords) => {
                        obj.scale.set(originalScale * coords.scale);
                    })
                    .chain(createPulseTween()) // 递归创建下一个脉冲
            );
    }
    
    createPulseTween().start();
    
    // 返回停止函数
    return () => {
        TWEEN.removeAll();
    };
}