import { NetEventId, GameAction, GameStartMode, BuffType } from './TetrisEvents.js';
import Tetris7BagGenerator from './Tetris7BagGenerator.js';
import RandGenerator from './RandGenerator.js';

export default class TetrisControlPlayer {
    constructor(game) {
        this.game = game;
        this.dropSpeedTimer = 0;
        this.dropPaused = 0;
        
        // 游戏状态
        this.isDead = false;
        this.dropDiff = 500;
        this.tempDropDiff = 0;
        
        // 游戏统计信息
        this.score = 0;
        this.linesCleared = 0;
        
        // 形状生成器
        this.shapeGenerator = null;
        this.nextShapInfos = [];
        
        // Buff系统
        this.buffRand = new RandGenerator(Date.now());
        this.currentBuff = null;
        this.buffProgress = 0;
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
        
        this.initSwipeControls();
        this.generateRandomBuff();
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

    getDropDiff() {
        return this.dropDiff + this.tempDropDiff;
    }
    addTempDropDiff(diff) {
        this.tempDropDiff += diff;
    }

    setDropPaused(paused) {
        if (paused) {
            this.dropPaused++;
        } else {
            this.dropPaused = Math.max(0, this.dropPaused - 1);
        }
    }

    generateRandomBuff() {
        const buffTypes = Object.values(BuffType);
        const randomIndex = this.buffRand.nextInt(buffTypes.length);
        this.currentBuff = buffTypes[randomIndex];
        this.buffProgress = 0;
        
        if (this.userView && this.userView.updateBuffDisplay) {
            this.userView.updateBuffDisplay();
        }
    }

    addBuffProgress(count) {
        if (!this.currentBuff) return;
        
        this.buffProgress = Math.min(this.buffProgress + count, this.currentBuff.maxCount);
        
        if (this.userView && this.userView.updateBuffDisplay) {
            this.userView.updateBuffDisplay();
        }
        
        if (this.buffProgress >= this.currentBuff.maxCount) {
            this.applyBuff();
        }
    }

    applyBuff() {
        if (!this.currentBuff) return;
        
        const buffType = this.currentBuff.name;
        this.doAction(GameAction.ApplyBuff, { buffType });
        
        this.currentBuff = null;
        this.buffProgress = 0;
        
        if (this.userView && this.userView.updateBuffDisplay) {
            this.userView.updateBuffDisplay();
        }
    }


    update() {
        if (this.dropPaused > 0) return;
        
        if (!this.currentBuff) {
            this.generateRandomBuff();
        }
        
        const deltaMS = this.game.pixi.ticker.deltaMS;
        this.dropSpeedTimer += deltaMS;
        if (this.dropSpeedTimer >= this.getDropDiff()) {
            this.dropSpeedTimer = 0;
            
            if (!this.userView.dropInfo) {
                this.doAction(GameAction.CreateNewShape);
            } else if (this.userView.isAtBottom(this.userView.dropInfo)) {
                this.doAction(GameAction.RemoveDropShape);
            } else {
                this.doAction(GameAction.AutoDrop);
            }
        }
    }

    onKeyDown(e) {
        const key = e.key.toLowerCase();
        
        if (e.key === ' ' || e.key === 'Space') {
            this.setDropPaused(this.dropPaused === 0);
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

    doAction(action, extraData = {}) {
        const elapsed = Date.now() - this.game.GameStartOption.StartTime;
        const actionData = {
            type: action,
            elapsed,
            ...extraData
        };
        
        this.userView.doGameAction(actionData);
        
        const frame = {
            ...actionData
        };
        this.player.frames.push(frame);
        
        // 只有多人模式才发送事件
        if (this.game.GameStartOption.StartMode !== GameStartMode.Single) {
            const eventData = {
                userId: this.player.userId,
                ...actionData
            };
            this.game.net.sendEvent(NetEventId.PlayerAction, eventData);
        }
    }

    initSwipeControls() {
        if (!this.userView) return;

        this.swipeStartPos = null;
        this.minSwipeDistance = 30;

        this.swipeStartHandler = this.onSwipeStart.bind(this);
        this.swipeMoveHandler = this.onSwipeMove.bind(this);
        this.swipeEndHandler = this.onSwipeEnd.bind(this);

        this.userView.eventMode = 'static';
        this.userView.on('pointerdown', this.swipeStartHandler);
        this.userView.on('pointermove', this.swipeMoveHandler);
        this.userView.on('pointerup', this.swipeEndHandler);
        this.userView.on('pointerupoutside', this.swipeEndHandler);
    }

    onSwipeStart(e) {
        const globalPos = e.global;
        this.swipeStartPos = { x: globalPos.x, y: globalPos.y };
    }

    onSwipeMove(e) {
        if (!this.swipeStartPos) return;
        e.preventDefault();
    }

    onSwipeEnd(e) {
        if (!this.swipeStartPos) return;

        const globalPos = e.global;
        const dx = globalPos.x - this.swipeStartPos.x;
        const dy = globalPos.y - this.swipeStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.minSwipeDistance) {
            this.swipeStartPos = null;
            return;
        }

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx > absDy) {
            if (dx > 0) {
                this.doAction(GameAction.MoveRight);
            } else {
                this.doAction(GameAction.MoveLeft);
            }
        } else {
            if (dy > 0) {
                this.doAction(GameAction.Drop);
            } else {
                this.doAction(GameAction.Rotate);
            }
        }

        this.swipeStartPos = null;
    }

    safeRemoveSelf() {
        window.removeEventListener('keydown', this.onKeyDownHandler);
        if (this.updateHandler) {
            this.game.pixi.ticker.remove(this.updateHandler);
        }
        
        if (this.userView && this.swipeStartHandler) {
            this.userView.off('pointerdown', this.swipeStartHandler);
        }
        if (this.userView && this.swipeMoveHandler) {
            this.userView.off('pointermove', this.swipeMoveHandler);
        }
        if (this.userView && this.swipeEndHandler) {
            this.userView.off('pointerup', this.swipeEndHandler);
            this.userView.off('pointerupoutside', this.swipeEndHandler);
        }
    }
}

