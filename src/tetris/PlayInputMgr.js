import { GameAction } from './data/TetrisEvents.js'

const minSwipeDistance = 30

export default class PlayInputMgr {
    init(dialog) {
        this.dialog = dialog
        this.swipeStartPos = null

        dialog.eventMode = 'static'
        dialog.event(window, 'keydown', (event) => this.onKeyDown(event))
        dialog.pixi(dialog, 'pointerdown', (event) => this.onSwipeStart(event))
        dialog.pixi(dialog, 'pointermove', (event) => this.onSwipeMove(event))
        dialog.pixi(dialog, 'pointerup', (event) => this.onSwipeEnd(event))
        dialog.pixi(dialog, 'pointerupoutside', (event) => this.onSwipeEnd(event))
    }

    onKeyDown(e) {
        const key = e.key.toLowerCase()
        const ruleMgr = this.dialog.ruleMgr

        if (e.key === ' ' || e.key === 'Space') {
            ruleMgr.setDropPaused(ruleMgr.dropPaused === 0)
        } else if (key === 'f') {
            ruleMgr.doAction(GameAction.SwitchShape)
        } else if (key === 'w' || e.key === 'ArrowUp') {
            ruleMgr.doAction(GameAction.Rotate)
        } else if (key === 's' || e.key === 'ArrowDown') {
            ruleMgr.doAction(GameAction.Drop)
        } else if (key === 'a' || e.key === 'ArrowLeft') {
            ruleMgr.doAction(GameAction.MoveLeft)
        } else if (key === 'd' || e.key === 'ArrowRight') {
            ruleMgr.doAction(GameAction.MoveRight)
        }
    }

    onSwipeStart(e) {
        const globalPos = e.global
        this.swipeStartPos = { x: globalPos.x, y: globalPos.y }
        this.appliedColOffset = 0
    }

    onSwipeMove(e) {
        if (!this.swipeStartPos) return
        e.preventDefault()

        // 按手指偏移量连续换算列数：偏移越多，移动的格子越多
        const stepDistance = this.dialog.gameView.tileSize
        const dx = e.global.x - this.swipeStartPos.x
        const targetColOffset = Math.trunc(dx / stepDistance)
        const ruleMgr = this.dialog.ruleMgr

        while (this.appliedColOffset < targetColOffset) {
            if (!ruleMgr.doAction(GameAction.MoveRight)) break
            this.appliedColOffset++
        }
        while (this.appliedColOffset > targetColOffset) {
            if (!ruleMgr.doAction(GameAction.MoveLeft)) break
            this.appliedColOffset--
        }
    }

    onSwipeEnd(e) {
        if (!this.swipeStartPos) return

        const dx = e.global.x - this.swipeStartPos.x
        const dy = e.global.y - this.swipeStartPos.y
        this.swipeStartPos = null

        // 左右移动已经在拖动过程中连续处理，这里只在竖直方向明显占主导时才判断旋转/下落手势
        if (Math.abs(dy) < minSwipeDistance || Math.abs(dy) <= Math.abs(dx)) return

        this.dialog.ruleMgr.doAction(dy > 0 ? GameAction.Drop : GameAction.Rotate)
    }

    destroy() {
        this.dialog = null
    }
}
