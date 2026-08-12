import * as TWEEN from '@tweenjs/tween.js'

export function makeButton(target, onTap) {
    target.eventMode = 'static'
    target.cursor = 'pointer'
    target.on('pointerdown', (event) => {
        event.stopPropagation()
        target.scale.set(0.95)
    })
    target.on('pointerup', () => target.scale.set(1))
    target.on('pointerupoutside', () => target.scale.set(1))
    target.on('pointercancel', () => target.scale.set(1))
    target.on('pointertap', (event) => {
        event.stopPropagation()
        onTap(event)
    })
    return target
}

export function appear(target) {
    target.scale.set(0)
    return new Promise((resolve) => {
        new TWEEN.Tween(target.scale)
            .to({ x: 1, y: 1 }, 280)
            .easing(TWEEN.Easing.Back.Out)
            .onComplete(resolve)
            .start()
    })
}

export function disappear(target) {
    return new Promise((resolve) => {
        new TWEEN.Tween(target.scale)
            .to({ x: 0, y: 0 }, 180)
            .easing(TWEEN.Easing.Back.In)
            .onComplete(resolve)
            .start()
    })
}

export function scaleOnce(target) {
    target.scale.set(1)
    return new Promise((resolve) => {
        new TWEEN.Tween(target.scale)
            .to({ x: 1.2, y: 1.2 }, 50)
            .easing(TWEEN.Easing.Back.Out)
            .chain(
                new TWEEN.Tween(target.scale)
                    .to({ x: 1, y: 1 }, 50)
                    .easing(TWEEN.Easing.Bounce.Out)
                    .onComplete(resolve),
            )
            .start()
    })
}
