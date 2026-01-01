import { NetEventId, GameAction, GameStartMode } from './TetrisEvents.js';
import RandGenerator from './RandGenerator.js';
import * as TetrisShape from '../TetrisShape.js';

export default class TetrisControlPlayer {
    constructor(game) {
        this.game = game;
        this.dropSpeedTimer = 0;
        this.dropPaused = false;
        
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
        this.onKeyDownHandler = this.onKeyDown.bind(this);
        window.addEventListener('keydown', this.onKeyDownHandler);
        
        // 初始化随机数生成器和形状队列
        this.shapeGenerator = new RandGenerator(this.game.GameStartOption.ShapeGeneratorSeed);
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
        
        // 如果队列数量不足2个，补足到2个
        const shapeTypes = Object.values(TetrisShape.TetrisShapeType);
        while (this.nextShapInfos.length < 2) {
            let newShapeIndex = this.shapeGenerator.nextInt(TetrisShape.TetrisShapeCount);
            const newShapeType = shapeTypes[newShapeIndex];
            const newColorIndex = newShapeIndex; // shapeType 的索引直接作为 colorIndex
            this.nextShapInfos.push({shapeType: newShapeType, colorIndex: newColorIndex});
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

    dropSpeed() {
        return 500 - (this.speedLevel - 1) * (500 - 100) / (10 - 1);
    }

    get moveAnimationDuration() {
        return this.dropSpeed() / 3;
    }

    update(deltaMS) {
        if (this.dropPaused) return;
        
        this.dropSpeedTimer += deltaMS;
        if (this.dropSpeedTimer >= this.dropSpeed()) {
            this.dropSpeedTimer = 0;
            this.doAction(GameAction.AutoDrop);
        }
    }

    onKeyDown(e) {
        const key = e.key.toLowerCase();
        
        if (key === 'f') {
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
    }
}

