import * as PIXI from 'pixi.js';

import { ShowLayer } from './ShooterObjBase.js';

export default class GameObjectManager extends PIXI.Container {
    constructor() {
        super();
        this.app = window.shooterApp;
        this.objects = [];
        this.layerContainers = {};
        // 创建每个显示层的container
        for (const key in ShowLayer) {
            const idx = ShowLayer[key];
            const layer = new PIXI.Container();
            this.layerContainers[idx] = layer;
            this.addChild(layer);
        }
    }
    add(obj) {
        if (!this.objects.includes(obj)) {
            this.objects.push(obj);
            // 自动放到对应层
            if (typeof obj.ShowLayer === 'number' && this.layerContainers[obj.ShowLayer]) {
                this.layerContainers[obj.ShowLayer].addChild(obj);
            } else if (obj instanceof PIXI.DisplayObject && obj.parent !== this) {
                this.addChild(obj);
            }
            obj.onAdd();
        }
    }
    remove(obj) {
        const idx = this.objects.indexOf(obj);
        if (idx !== -1) {
            this.objects.splice(idx, 1);
            // 从各层container移除
            for (const layer of Object.values(this.layerContainers)) {
                if (obj.parent === layer) layer.removeChild(obj);
            }
            if (obj.parent === this) this.removeChild(obj);
            obj.onDestroy();
        }
    }
    updateAll() {
        // 统一update，自动移除出界对象
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (obj.isOutOfCircle(window.shooterApp.radius)) {
                this.remove(obj);
            }
        }
    }
    getAll() {
        return this.objects;
    }
}
