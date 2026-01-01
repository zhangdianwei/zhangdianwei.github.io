class RandGenerator {
    constructor(seed) {
        this.seed = seed || Date.now();
        this.state = this.seed;
    }

    next() {
        this.state = (this.state * 1103515245 + 12345) & 0x7fffffff;
        return this.state;
    }

    nextInt(max) {
        return this.next() % max;
    }

    nextIntRange(min, max) {
        return min + this.nextInt(max - min);
    }

    nextFloat() {
        return this.next() / 0x7fffffff;
    }

    reset(seed) {
        if (seed !== undefined) {
            this.seed = seed;
        }
        this.state = this.seed;
    }
}

export default RandGenerator;
