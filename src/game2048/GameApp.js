import * as PIXI from 'pixi.js';

export class GameApp {
    static _instance;

    pixi = null;
    radius = 0;
    tickers = new Set();
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
        if (this.pixi) {
            this.pixi.ticker.add(this.updateTickManager, this);
        }
    }

    setRadius(r) {
        this.radius = r;
    }

    registerTick(updateFn, context) {
        this.tickers.add({ updateFn, context });
    }

    unregisterTickByObj(objContext) {
        this.tickers.forEach(ticker => {
            if (ticker.context === objContext) {
                this.tickers.delete(ticker);
            }
        });
    }

    updateTickManager() {
        if (!this.pixi || !this.pixi.ticker) return;
        const deltaMs = this.pixi.ticker.deltaMS;
        this.tickers.forEach((ticker) => {
            try {
                ticker.updateFn.call(ticker.context, deltaMs);
            } catch (error) {
                console.error("Error in ticker update:", error, "context:", ticker.context);
            }
        });
    }

    destroyGlobalResources() {
        if (this.pixi && this.pixi.ticker) {
            this.pixi.ticker.remove(this.updateTickManager, this);
        }
        this.tickers.clear();
        this.pixi = null;
        this.rootContainer = null;
        this.bgCircle = null; 
    }
}
