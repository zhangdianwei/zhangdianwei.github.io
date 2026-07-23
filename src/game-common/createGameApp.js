import * as PIXI from 'pixi.js';

function fitSize(designNum) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return w < h
        ? { width: designNum, height: Math.round(designNum * h / w) }
        : { width: Math.round(designNum * w / h), height: designNum };
}

export function createGameApp(canvasElement, designNum) {
    const { width, height } = fitSize(designNum);

    const pixi = new PIXI.Application({
        view: canvasElement,
        width,
        height,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
        backgroundAlpha: 0,
    });

    const scale = Math.min(window.innerWidth / width, window.innerHeight / height);
    canvasElement.style.transform = `scale(${scale})`;
    canvasElement.style.transformOrigin = 'center';

    return pixi;
}
