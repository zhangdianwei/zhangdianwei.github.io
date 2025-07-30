import * as TWEEN from '@tweenjs/tween.js';

// 出现动画（从0缩放到1）
export function appear(obj) {
    return new Promise((resolve) => {
        obj.scale.set(0);
        new TWEEN.Tween(obj.scale)
            .to({ x: 1, y: 1 }, 280)
            .easing(TWEEN.Easing.Back.Out)
            .onComplete(() => resolve())
            .start();
    });
}

// 消失动画（缩放到0）
export function disappear(obj) {
    return new Promise((resolve) => {
        new TWEEN.Tween(obj.scale)
            .to({ x: 0, y: 0 }, 180)
            .easing(TWEEN.Easing.Back.In)
            .onComplete(() => resolve())
            .start();
    });
}

// 放大效果（从当前大小放大到指定倍数，然后恢复）
export function scaleOnce(obj) {
    return new Promise((resolve) => {
        // 开始设置缩放为1
        obj.scale.set(1);
        
        new TWEEN.Tween(obj.scale)
            .to({ x: 1.2, y: 1.2 }, 50)
            .easing(TWEEN.Easing.Back.Out)
            .chain(
                new TWEEN.Tween(obj.scale)
                    .to({ x: 1, y: 1 }, 50)
                    .easing(TWEEN.Easing.Bounce.Out)
                    .onComplete(() => resolve())
            )
            .start();
    });
}