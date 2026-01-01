import { GameAction } from './TetrisEvents.js';
import Tetris7BagGenerator from './Tetris7BagGenerator.js';
import * as TetrisShape from '../TetrisShape.js';

export default class TetrisControlFromNet {
    constructor(game) {
        this.game = game;
        
        // 游戏状态
        this.speedLevel = 1;
        this.isDead = false;
        
        // 游戏统计信息
        this.score = 0;
        this.linesCleared = 0;
        
        // 形状生成器
        this.shapeGenerator = null;
        this.nextShapInfos = [];
    }

    init(userView, player) {
        this.userView = userView;
        this.player = player;
        this.dropSpeedTimer = 0;
        this.dropPaused = false;
        
        // 初始化 7-bag 随机生成器和形状队列
        this.shapeGenerator = new Tetris7BagGenerator(this.game.GameStartOption.ShapeGeneratorSeed);
        this.nextShapInfos = [];
        this.initShapeQueue();
    }

    initShapeQueue() {
        this.nextShapInfos = [];
        this.getNextShapeInfo();
    }

    getNextShapeInfo() {
        // 从队列头部取出一个形状信息对象
        const shapeInfo = this.nextShapInfos.shift();
        
        // 如果队列数量不足2个，补足到2个（使用 7-bag 生成器）
        while (this.nextShapInfos.length < 2) {
            const nextShape = this.shapeGenerator.next();
            this.nextShapInfos.push(nextShape);
        }
        
        // 通知 view 更新下一个形状预览
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
            
            // 通知 view 更新下一个形状预览
            if (this.userView && this.userView.updateNextShapePreview) {
                this.userView.updateNextShapePreview();
            }
        }
    }

    update(deltaMS) {
        if (this.dropPaused) return;
        
        this.dropSpeedTimer += deltaMS;
        if (this.dropSpeedTimer >= this.dropSpeed()) {
            this.dropSpeedTimer = 0;
            const elapsed = Date.now() - this.game.GameStartOption.StartTime;
            const actionData = {
                GameAction: GameAction.AutoDrop,
                elapsed
            };
            this.userView.doGameAction(actionData);
        }
    }

    dropSpeed() {
        return 500 - (this.speedLevel - 1) * (500 - 100) / (10 - 1);
    }

    get moveAnimationDuration() {
        return this.dropSpeed() / 3;
    }

    applyAction(actionData) {
        this.userView.doGameAction(actionData);
        
        const frame = {
            type: actionData.GameAction,
            ...actionData
        };
        this.player.frames.push(frame);
    }

    safeRemoveSelf() {
    }
}

