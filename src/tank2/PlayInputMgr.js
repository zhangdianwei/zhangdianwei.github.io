const ControlToDir = {
    up: 0,
    right: 1,
    down: 2,
    left: 3,
}

export default class PlayInputMgr {
    init(dialog) {
        this.dialog = dialog
        this.moveKeys = []
        this.shootKeys = new Set()
    }

    setControl(control, pressed, source) {
        const dir = ControlToDir[control]
        if (dir !== undefined) {
            if (pressed) this.addMoveKey(source, dir)
            else this.removeMoveKey(source)
        } else if (control === 'a' || control === 'b') {
            if (pressed) this.shootKeys.add(source)
            else this.shootKeys.delete(source)
            this.dialog.gameView.player?.setShooting(this.shootKeys.size > 0)
        }
    }

    addMoveKey(key, dir) {
        if (this.moveKeys.some((item) => item.key === key)) return
        this.moveKeys.push({ key, dir })
        this.checkMovePlayer()
    }

    removeMoveKey(key) {
        const index = this.moveKeys.findIndex((item) => item.key === key)
        if (index === -1) return
        this.moveKeys.splice(index, 1)
        this.checkMovePlayer()
    }

    checkMovePlayer() {
        const player = this.dialog.gameView.player
        if (!player) return

        const last = this.moveKeys.at(-1)
        if (!last) {
            player.setMoving(false)
        } else {
            player.setDirection(last.dir)
            player.setMoving(true)
        }
    }

    releaseAll() {
        this.moveKeys.length = 0
        this.shootKeys.clear()
        const player = this.dialog.gameView.player
        player?.setMoving(false)
        player?.setShooting(false)
    }

    destroy() {
        this.releaseAll()
        this.dialog = null
    }
}
