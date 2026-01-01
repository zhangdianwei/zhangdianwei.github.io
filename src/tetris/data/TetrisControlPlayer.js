import { NetEventId, GameAction, GameStartMode } from './TetrisEvents.js';
import Tetris7BagGenerator from './Tetris7BagGenerator.js';
import * as TetrisShape from '../TetrisShape.js';

export default class TetrisControlPlayer {
    constructor(game) {
        this.game = game;
        this.dropSpeedTimer = 0;
        this.dropPaused = false;
        
        // 游戏状态
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
        this.onKeyDownHandler = this.onKeyDown.bind(this);
        window.addEventListener('keydown', this.onKeyDownHandler);
        
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

    dropDiff() {
        return Math.max(100, 500 - this.linesCleared * 100);
    }

    get moveAnimationDuration() {
        return this.dropDiff() / 3;
    }

    update() {
        if (this.dropPaused) return;
        
        const deltaMS = this.game.pixi.ticker.deltaMS;
        this.dropSpeedTimer += deltaMS;
        if (this.dropSpeedTimer >= this.dropDiff()) {
            this.dropSpeedTimer = 0;
            this.doAction(GameAction.AutoDrop);
        }
    }

    onKeyDown(e) {
        const key = e.key.toLowerCase();
        
        if (e.key === ' ' || e.key === 'Space') {
            this.dropPaused = !this.dropPaused;
        } else if (key === 'f') {
            this.switchNextShapeInfo();
            this.doAction(GameAction.SwitchShape);
        } else if (key === 'w' || e.key === 'ArrowUp') {
            this.doAction(GameAction.Rotate);
        } else if (key === 's' || e.key === 'ArrowDown') {
            this.doAction(GameAction.Drop);
        } else if (key === 'a' || e.key === 'ArrowLeft') {
            this.doAction(GameAction.MoveLeft);
        } else if (key === 'd' || e.key === 'ArrowRight') {
            this.doAction(GameAction.MoveRight);
        }
    }

    doAction(action) {
        const elapsed = Date.now() - this.game.GameStartOption.StartTime;
        const actionData = {
            GameAction: action,
            elapsed
        };
        
        this.userView.doGameAction(actionData);
        
        const frame = {
            type: actionData.GameAction,
            ...actionData
        };
        this.player.frames.push(frame);
        
        // 只有多人模式才发送事件
        if (this.game.GameStartOption.StartMode !== GameStartMode.Single) {
            const eventData = {
                userId: this.player.userId,
                type: actionData.GameAction,
                ...actionData
            };
            this.game.net.sendEvent(NetEventId.PlayerAction, eventData);
        }
    }

    safeRemoveSelf() {
        window.removeEventListener('keydown', this.onKeyDownHandler);
        if (this.updateHandler) {
            this.game.pixi.ticker.remove(this.updateHandler);
        }
    }
}

