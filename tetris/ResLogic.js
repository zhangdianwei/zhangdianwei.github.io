import { FontLoader } from "FontLoader"

class ResLogic {
    constructor() {
        this.toLoad = [
            { name: "font", res: "https://unpkg.com/three@0.152.0/examples/fonts/helvetiker_regular.typeface.json", type: "font" },
            // { name: "dinosaur", res: "/tetris/level1.png", type: "font" },
        ]

        this.onProgress = null;
        this.onFinish = null;

        this.loadedCount = 0;
    }

    getLoadedCount() {
        return this.loadedCount;
    }

    getTotalCount() {
        return this.toLoad.length;
    }

    isFinished() {
        return this.getLoadedCount() >= this.getTotalCount();
    }

    startLoad() {
        this.loadedCount = 0;

        const self = this;
        this.toLoad.forEach((cfg) => {
            if (cfg.type == "font") {
                const loader = new FontLoader();
                loader.load(cfg.res, function (font) {
                    self[cfg.name] = font;
                    self._onProgress();
                });
            }
        });
    }

    _onProgress() {
        this.loadedCount += 1;
        if (this.onProgress) {
            this.onProgress();
        }

        if (this.loadedCount >= this.getTotalCount()) {
            if (this.onFinish) {
                this.onFinish();
            }
        }
    }
}

export { ResLogic };