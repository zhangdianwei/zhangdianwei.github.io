export default class TickManager {
    constructor() {
        this.time = 0; // 总时间，秒
        this.frame = 0; // 总帧数
        this.updaters = []; // {fn, obj}
    }

    register(fn, obj) {
        if (!obj) {
            throw new Error('TickManager.register: obj 参数不能为空');
        }
        if (!this.updaters.some(u => u.fn === fn)) {
            this.updaters.push({ fn, obj });
        }
    }

    unregister(fn) {
        const idx = this.updaters.findIndex(u => u.fn === fn);
        if (idx !== -1) this.updaters.splice(idx, 1);
    }

    unregisterByObj(obj) {
        this.updaters = this.updaters.filter(u => u.obj !== obj);
    }

    tick(deltaTime) {
        this.time += deltaTime;
        this.frame++;
        for (let i = 0; i < this.updaters.length; i++) {
            this.updaters[i].fn(deltaTime, this.time, this.frame);
        }
    }
}
