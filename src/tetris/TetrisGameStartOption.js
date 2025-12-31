export default class TetrisGameStartOption {
    constructor() {
        this.singleMode = true;

        this.startTime = Date.now();
        this.shapeGeneratorSeed = Date.now();

        this.frames = [];
    }

    get StartTime() {
        return this.startTime;
    }
    set StartTime(value) {
        this.startTime = value;
    }

    get ShapeGeneratorSeed() {
        return this.shapeGeneratorSeed;
    }
    set ShapeGeneratorSeed(value) {
        this.shapeGeneratorSeed = value;
    }

    get SingleMode() {
        return this.singleMode;
    }
    set SingleMode(value) {
        this.singleMode = value;
    }

    get Frames() {
        return this.frames;
    }
    AddFrame(frame) {
        this.frames.push(frame);
    }

    // 从对象数据初始化字段
    initBySingle() {
        this.ShapeGeneratorSeed = Date.now();
        this.StartTime = Date.now();
        this.SingleMode = true;
    }

    initByMulti(data) {
        // 将字符串时间戳转换回数字
        this.ShapeGeneratorSeed = data.shapeGeneratorSeed ? Number(data.shapeGeneratorSeed) : Date.now();
        this.StartTime = data.startTime ? Number(data.startTime) : Date.now();
        this.SingleMode = false;
    }
}
