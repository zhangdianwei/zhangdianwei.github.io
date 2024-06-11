import TankHelper from "./TankHelper";

class Timer {
    constructor() {
        this.delta = 0;
        this.elapsed = 0;

        this.records = [];

        this.shouldRemoves = [];
        this.shouldAdds = [];
    }

    update({ delta, elapsed }) {
        this.delta = delta;
        this.elapsed = elapsed;

        for (let i = 0; i < this.records.length; ++i) {
            var record = this.records[i];
            record.acc += delta;
            if (record.acc >= record.second) {

                record.callback({ delta: record.acc, elapsed });

                record.acc = 0;

                if (record.times) {
                    record.times -= 1;
                    if (record.times <= 0) {
                        this.shouldRemoves.push(record.callback);
                    }
                }
            }
        }

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
            var predict = (record) => {
                return record.callback == this.shouldRemoves[i];
            };
            TankHelper.removeArrayValueIf(this.records, predict);
            TankHelper.removeArrayValueIf(this.shouldAdds, predict);
        }
        this.shouldRemoves.length = 0;
    }

    tick(callback, second) {
        second = second || 0;
        var record = { second, callback, acc: 0 };
        this.shouldAdds.push(record);
    }

    tickOnce(callback, second) {
        second = second || 0;
        var record = { second, callback, acc: 0, times: 1 };
        this.shouldAdds.push(record);
    }

    untick(callback) {
        this.shouldRemoves.push(callback);
    }
}

export default Timer