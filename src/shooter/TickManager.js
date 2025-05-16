export default class TickManager {
    constructor() {
        this.time = 0; // 总时间，秒
        this.frame = 0; // 总帧数
        this.updaters = [];
    }

    register(fn) {
        if (!this.updaters.includes(fn)) {
            this.updaters.push(fn);
        }
    }

    unregister(fn) {
        const idx = this.updaters.indexOf(fn);
        if (idx !== -1) this.updaters.splice(idx, 1);
    }

    tick(deltaTime) {
        this.time += deltaTime;
        this.frame++;
        for (let i = 0; i < this.updaters.length; i++) {
            this.updaters[i](deltaTime, this.time, this.frame);
        }
    }
}
