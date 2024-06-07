class Timer {
    constructor() {
        this.delta = 0;
        this.elapsed = 0;

        this.callbacks = [];
    }

    update({ delta, elapsed }) {
        this.delta = delta;
        this.elapsed = elapsed;
    }
}

export default Timer