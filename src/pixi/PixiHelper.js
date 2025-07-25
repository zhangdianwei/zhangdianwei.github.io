import * as PIXI from 'pixi.js';

export function initDom(domElement, options = {}) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); // 判断是否为移动设备

    let width = 0;
    let height = 0;
    if (isMobile) {
        const window_width_height_ratio = windowWidth / windowHeight;
        const design_width_height_ratio = options.designWidth / options.designHeight;
        if (window_width_height_ratio > design_width_height_ratio) {
            height = height;
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
