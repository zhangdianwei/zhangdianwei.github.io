import { GameAction, BuffType } from './data/TetrisEvents.js'
import Tetris7BagGenerator from './data/Tetris7BagGenerator.js'

export default class PlayRuleMgr {
    constructor() {
        this.dropSpeedTimer = 0
        this.dropPaused = 0

        this.isDead = false
        this.dropDiff = 500
        this.tempDropDiff = 0

        this.score = 0
        this.linesCleared = 0
        this.comboCount = -1
        this.backToBackCount = 0

        this.shapeGenerator = null
        this.nextShapInfos = []

        this.buffPool = []
        this.currentBuff = null
        this.buffProgress = 0
    }

    init(dialog) {
        this.dialog = dialog
        this.startTime = Date.now()
        this.seed = Date.now()

        this.shapeGenerator = new Tetris7BagGenerator(this.seed)
        this.nextShapInfos = []
        this.initShapeQueue()

        this.generateRandomBuff()
    }

    initShapeQueue() {
        this.nextShapInfos = []
        this.getNextShapeInfo()
    }

    getNextShapeInfo() {
        // 从队列头部取出一个形状信息对象
        const shapeInfo = this.nextShapInfos.shift()

        // 如果队列数量不足2个，补足到2个（使用 7-bag 生成器）
        while (this.nextShapInfos.length < 2) {
            const nextShape = this.shapeGenerator.next()
            this.nextShapInfos.push(nextShape)
        }

        this.dialog.hudView?.updateNextShapePreview()

        return shapeInfo
    }

    switchNextShapeInfo() {
        if (this.nextShapInfos.length >= 2) {
            const temp = this.nextShapInfos[0]
            this.nextShapInfos[0] = this.nextShapInfos[1]
            this.nextShapInfos[1] = temp

            this.dialog.hudView?.updateNextShapePreview()
        }
    }

    getDropDiff() {
        const level = this.getLevel()
        const baseDropDiff = Math.max(120, this.dropDiff - (level - 1) * 35)
        return Math.max(80, baseDropDiff + this.tempDropDiff)
    }

    getLevel() {
        return Math.min(15, Math.floor(this.linesCleared / 10) + 1)
    }

    addTempDropDiff(diff) {
        this.tempDropDiff += diff
    }

    setDropPaused(paused) {
        if (paused) {
            this.dropPaused++
        } else {
            this.dropPaused = Math.max(0, this.dropPaused - 1)
        }
    }

    generateRandomBuff() {
        const buffTypes = Object.values(BuffType)

        // 如果数组为空，生成新的数组并打乱
        if (this.buffPool.length === 0) {
            // 生成 [0, 1, 2, ..., buffTypes.length-1] 的数组
            this.buffPool = Array.from({ length: buffTypes.length }, (_, i) => i)

            // Fisher-Yates 洗牌算法
            for (let i = this.buffPool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                    ;[this.buffPool[i], this.buffPool[j]] = [this.buffPool[j], this.buffPool[i]]
            }
        }

        // 从数组头部取出一个索引
        const randomIndex = this.buffPool.shift()
        this.currentBuff = buffTypes[randomIndex]
        this.buffProgress = 0

        this.dialog.hudView?.updateBuffDisplay()
    }

    addBuffProgress(count) {
        if (!this.currentBuff) return

        this.buffProgress = Math.min(this.buffProgress + count, this.currentBuff.maxCount)

        this.dialog.hudView?.updateBuffDisplay()

        if (this.buffProgress >= this.currentBuff.maxCount) {
            this.applyBuff()
        }
    }

    applyBuff() {
        if (!this.currentBuff) return

        const buffType = this.currentBuff.name
        this.doAction(GameAction.ApplyBuff, { buffType })

        this.currentBuff = null
        this.buffProgress = 0

        this.dialog.hudView?.updateBuffDisplay()
    }

    update() {
        if (this.dropPaused > 0) return

        if (!this.currentBuff) {
            this.generateRandomBuff()
        }

        const gameView = this.dialog.gameView
        const deltaMS = this.dialog.app.pixi.ticker.deltaMS
        this.dropSpeedTimer += deltaMS
        if (this.dropSpeedTimer >= this.getDropDiff()) {
            this.dropSpeedTimer = 0

            if (!gameView.dropInfo) {
                this.doAction(GameAction.CreateNewShape)
            } else if (gameView.isAtBottom(gameView.dropInfo)) {
                this.doAction(GameAction.RemoveDropShape)
            } else {
                this.doAction(GameAction.AutoDrop)
            }
        }
    }

    doAction(action, extraData = {}) {
        const elapsed = Date.now() - this.startTime
        const actionData = {
            type: action,
            elapsed,
            ...extraData
        }

        const success = this.dialog.gameView.doGameAction(actionData)

        const frame = {
            ...actionData
        }
        this.dialog.player.frames.push(frame)

        return success
    }

    destroy() {
        this.dialog = null
    }
}
