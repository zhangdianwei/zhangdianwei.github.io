class Timer {
    constructor() {
        this.delta = 0;
        this.elapsed = 0;

        this.records = [];
        this.inUpdate = false;
        this.shouldRemoves = [];
        this.shouldAdds = [];
    }

    update({ delta, elapsed }) {
        this.delta = delta;
        this.elapsed = elapsed;

        this.inUpdate = true;
        for (let i = 0; i < this.records.length; ++i) {
            var record = this.records[i];
            record.acc += delta;
            if (record.acc >= record.second) {
                record.acc -= record.second;

                record.callback({ delta, elapsed });

                if (record.times) {
                    record.times -= 1;
                    if (record.times <= 0) {
                        this.shouldRemoves.push(record);
                    }
                }
            }
        }
        this.inUpdate = false;

        this.checkRemove();
        this.checkAdd();
    }

    checkAdd() {
        for (let i = 0; i < this.shouldAdds.length; ++i) {
            this.records.push(this.shouldAdds[i]);
        }
        this.shouldAdds.length = 0;
    }

    checkRemove() {
        for (let i = 0; i < this.shouldRemoves.length; ++i) {
            var index = this.records.indexOf(this.shouldRemoves[i]);
            if (index >= 0) {
                this.records.splice(index, 1);
            }
        }
    }

    tick(callback, second) {
        second = second || 0;
        var record = { second, callback, acc: 0 };
        if (this.inUpdate) {
            this.shouldAdds.push(record);
        }
        else {
            this.records.push(record);
        }
    }

    tickOnce(callback, second) {
        second = second || 0;
        var record = { second, callback, ac: 0, times: 1 };
        if (this.inUpdate) {
            this.shouldAdds.push(record);
        }
        else {
            this.records.push(record);
        }
    }
}

export default Timer