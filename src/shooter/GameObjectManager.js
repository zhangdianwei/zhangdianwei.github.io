import * as PIXI from 'pixi.js';

export default class GameObjectManager extends PIXI.Container {
    constructor(app) {
        super();
        this.app = app;
        this.objects = [];
    }
    add(obj) {
        if (!this.objects.includes(obj)) {
            this.objects.push(obj);
            if (obj instanceof PIXI.DisplayObject && obj.parent !== this) {
                this.addChild(obj);
            }
        }
    }
    remove(obj) {
        const idx = this.objects.indexOf(obj);
        if (idx !== -1) {
            this.objects.splice(idx, 1);
            if (obj.parent === this) this.removeChild(obj);
        }
    }
    updateAll() {
        // 统一update，自动移除出界对象
        this.objects = this.objects.filter(obj => {
            if (typeof obj.update === 'function') obj.update();
            if (typeof obj.isOutOfCircle === 'function' && obj.isOutOfCircle(this.app.radius)) {
                if (obj.parent) obj.parent.removeChild(obj);
                return false;
            }
            return true;
        });
    }
    clear() {
        this.objects.forEach(obj => {
            if (obj.parent === this) this.removeChild(obj);
        });
        this.objects = [];
    }
    getAll() {
        return this.objects.slice();
    }
}
