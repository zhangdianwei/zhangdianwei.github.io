import { GameAction } from './TetrisEvents.js';
import Tetris7BagGenerator from './Tetris7BagGenerator.js';

export default class TetrisControlFromNet {
    constructor(game) {
        this.game = game;
        this.isDead = false;
        this.score = 0;
        this.linesCleared = 0;
        this.shapeGenerator = null;
        this.nextShapInfos = [];
        this.currentTime = 0;
        this.processedFrameIndex = 0;
    }

    init(userView, player) {
        this.userView = userView;
        this.player = player;
        this.dropPaused = false;
        this.currentTime = 0;
        this.processedFrameIndex = 0;
        
        this.shapeGenerator = new Tetris7BagGenerator(this.game.GameStartOption.ShapeGeneratorSeed);
        this.nextShapInfos = [];
        this.initShapeQueue();
        
        this.updateHandler = this.update.bind(this);
        this.game.pixi.ticker.add(this.updateHandler, this);
    }

    initShapeQueue() {
        this.nextShapInfos = [];
        this.getNextShapeInfo();
    }

    getNextShapeInfo() {
        const shapeInfo = this.nextShapInfos.shift();
        
        while (this.nextShapInfos.length < 2) {
            const nextShape = this.shapeGenerator.next();
            this.nextShapInfos.push(nextShape);
        }
        
        if (this.userView && this.userView.updateNextShapePreview) {
            this.userView.updateNextShapePreview();
        }
        
        return shapeInfo;
    }

    switchNextShapeInfo() {
        if (this.nextShapInfos.length >= 2) {
            const temp = this.nextShapInfos[0];
            this.nextShapInfos[0] = this.nextShapInfos[1];
            this.nextShapInfos[1] = temp;
            
            if (this.userView && this.userView.updateNextShapePreview) {
                this.userView.updateNextShapePreview();
            }
        }
    }

    update() {
        if (this.dropPaused || this.isDead) return;
        
        if (this.player.frames.length === 0) {
            return;
        }
        
        const elapsed = Date.now() - this.game.GameStartOption.StartTime;
        const maxExecutionsPerFrame = 1;
        let executedCount = 0;
        
        while (this.processedFrameIndex < this.player.frames.length && executedCount < maxExecutionsPerFrame) {
            const frame = this.player.frames[this.processedFrameIndex];
            
            if (frame.elapsed <= elapsed) {
                const actionData = {
                    GameAction: frame.GameAction || frame.type,
                    ...frame
                };
                this.userView.doGameAction(actionData);
                this.processedFrameIndex++;
                executedCount++;
            } else {
                break;
            }
        }
    }

    dropDiff() {
        return Math.max(100, 500 - this.linesCleared * 100);
    }

    get moveAnimationDuration() {
        return this.dropDiff() / 3;
    }

    applyAction(actionData) {
        const frame = {
            type: actionData.GameAction,
            ...actionData
        };
        this.player.frames.push(frame);
    }

    safeRemoveSelf() {
        if (this.updateHandler) {
            this.game.pixi.ticker.remove(this.updateHandler);
        }
    }
}

