import * as PIXI from 'pixi.js';

export class GameApp {
    static _instance;

    pixi = null;
    radius = 0;
    rootContainer = null;
    bgCircle = null;

    constructor() {
        // Intentionally left blank or for future use if direct instantiation needs more checks
    }

    static get instance() {
        if (!GameApp._instance) {
            GameApp._instance = new GameApp();
        }
        return GameApp._instance;
    }

    initApp(app) {
        this.pixi = app;
        // Timer-related ticker logic removed
    }

    setRadius(r) {
        this.radius = r;
    }

    destroyGlobalResources() {
        // Timer-related ticker logic removed
        this.pixi = null;
        this.rootContainer = null;
        this.bgCircle = null; 
    }
}
