import * as PIXI from 'pixi.js';

export function initDom(domElement, options = {}) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scale = Math.min(windowWidth / options.designWidth, windowHeight / options.designHeight) * options.scale;
    domElement.style.width = options.designWidth + 'px';
    domElement.style.height = options.designHeight + 'px';
    domElement.style.transform = `scale(${scale})`;
}

export function createPixi(domElement) {
    return new PIXI.Application({
        width: domElement.clientWidth,
        height: domElement.clientHeight,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        view: domElement
    });
}
