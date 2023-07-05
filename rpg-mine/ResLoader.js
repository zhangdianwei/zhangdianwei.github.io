import { FontLoader } from "/three@0.152.0/examples/jsm/loaders/FontLoader.js"
import { GLTFLoader } from '/three@0.152.0/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from '/three@0.152.0/examples/jsm/loaders/FBXLoader.js';

class ResLoader {
    constructor() {
        this.onProgress = null;
        this.onFinish = null;

        this.toLoad = [];
        this.loadedCount = 0;
    }

    /*
    resources: [{
        url: "/rpg-mine/rpg-mine.fbx"
        loader: "FBXLoader"
    }]
    */
    load(resources, onProgress, onFinish) {
        this.toLoad = resources.map((r) => {
            let obj = r;
            if (!obj.loader) {
                obj.loader = this.getLoaderFromName(r.url);
            }
            if (!obj.name) {
                obj.name = r.url;
            }
            return obj;
        });

        this.onProgress = onProgress;
        this.onFinish = onFinish;

        this.startLoad();
    }

    getLoaderFromName(name) {
        let s = name.split('.');
        let ext = s[s.length - 1];
        switch (ext) {
            case "fbx": return "FBXLoader";
            case "glb": return "GLTFLoader";
            case "png": return "TextureLoader";
            case "jpg": return "TextureLoader";
            case "jpeg": return "TextureLoader";
        }
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
            let loader = null;
            if (cfg.loader == "FontLoader") {
                loader = new FontLoader();
            }
            else if (cfg.loader == "GLTFLoader") {
                loader = new GLTFLoader();
            }
            else if (cfg.loader == "FBXLoader") {
                loader = new FBXLoader();
            }
            else if (cfg.loader == "TextureLoader") {
                loader = new THREE.TextureLoader();
            }

            loader.load(cfg.url, function (result) {
                self[cfg.name] = result;
                self._onProgress(result);
            });
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

export { ResLoader };