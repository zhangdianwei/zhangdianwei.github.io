import { GameStartMode } from './TetrisEvents.js';

export default class TetrisGameStartOption {
    constructor() {
        this.startMode = GameStartMode.Single;

        this.startTime = Date.now();
        this.shapeGeneratorSeed = Date.now();
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

    get StartMode() {
        return this.startMode;
    }

    // 从对象数据初始化字段
    initBySingle(startMode) {
        this.startMode = startMode;
        this.ShapeGeneratorSeed = Date.now();
        this.StartTime = Date.now();
    }

    initByMulti(data) {
        this.startMode = GameStartMode.PlayerMatch;
        this.ShapeGeneratorSeed = Number(data.shapeGeneratorSeed);
        this.StartTime = Number(data.startTime);
    }
}
