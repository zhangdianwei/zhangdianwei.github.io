import { NetEventId, GameAction, GameStartMode } from './TetrisEvents.js';
import RandGenerator from './RandGenerator.js';
import * as TetrisShape from '../TetrisShape.js';

/**
 * 机器人控制器
 * 负责处理机器人逻辑，操作 TetrisGameUserView，并记录和广播操作
 */
export default class TetrisControlRobot {
    constructor(game) {
        this.game = game;
        this.thinkTimer = 0;
        this.thinkInterval = 500;
        
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

    update(deltaMS) {
        if (this.isDead || this.dropPaused) {
            return;
        }

        this.dropSpeedTimer += deltaMS;
        if (this.dropSpeedTimer >= this.dropSpeed()) {
            this.dropSpeedTimer = 0;
            this.doAction(GameAction.AutoDrop);
        }

        this.thinkTimer += deltaMS;
        if (this.thinkTimer >= this.thinkInterval) {
            this.thinkTimer = 0;
            this.thinkAndAct();
        }
    }

    dropSpeed() {
        return 500 - (this.speedLevel - 1) * (500 - 100) / (10 - 1);
    }

    get moveAnimationDuration() {
        return this.dropSpeed() / 3;
    }

    /**
     * 机器人思考和行动
     */
    thinkAndAct() {
        let action = GameAction.MoveLeft;
        
        if (this.userView.canMoveLeft() && Math.random() < 0.3) {
            action = GameAction.MoveLeft;
        } else if (this.userView.canMoveRight() && Math.random() < 0.3) {
            action = GameAction.MoveRight;
        } else if (Math.random() < 0.2) {
            action = GameAction.Rotate;
        } else if (Math.random() < 0.1) {
            action = GameAction.Drop;
        }

        this.doAction(action);
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
    }
}

