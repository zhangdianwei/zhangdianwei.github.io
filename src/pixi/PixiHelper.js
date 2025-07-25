import * as PIXI from 'pixi.js';

export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function initDom(domElement, options = {}) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const isFullScreen = options.isFullScreen || isMobile();

    let width = 0;
    let height = 0;
    if (isFullScreen) {
        const window_width_height_ratio = windowWidth / windowHeight;
        const design_width_height_ratio = options.designWidth / options.designHeight;
        if (window_width_height_ratio > design_width_height_ratio) {
            height = options.designHeight;
            width = height * window_width_height_ratio;
        } else {
            width = options.designWidth;
            height = width / window_width_height_ratio;
        }
    } else {
        width = options.designWidth;
        height = options.designHeight;
    }

    let scale = Math.min(windowWidth / width, windowHeight / height);
    scale *= (options.scale || 1);
    domElement.style.width = width + 'px';
    domElement.style.height = height + 'px';
    domElement.style.transform = `scale(${scale})`;
    domElement.style.transformOrigin = 'center';

    console.log("initDom", width, height, domElement.clientWidth, domElement.clientHeight, domElement.style.transform, domElement.style.transformOrigin);
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
