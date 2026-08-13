const MoveKeys = ['ArrowUp', 'KeyW', 'ArrowRight', 'KeyD', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA']

export default class PlayInputMgr {
    init(dialog) {
        this.dialog = dialog
        this.moveKeys = []

        dialog.event(window, 'keydown', (event) => this.keyDown(event.code))
        dialog.event(window, 'keyup', (event) => this.keyUp(event.code))
    }

    keyDown(keyCode) {
        const player = this.dialog.gameView.player
        if (!player) return

        if (MoveKeys.includes(keyCode)) {
            this.addMoveKey(keyCode)
        } else if (keyCode === 'Space') {
            player.setShooting(true)
        }
    }

    keyUp(keyCode) {
        const player = this.dialog.gameView.player
        if (!player) return

        if (MoveKeys.includes(keyCode)) {
            this.removeMoveKey(keyCode)
        } else if (keyCode === 'Space') {
            player.setShooting(false)
        }
    }

    addMoveKey(keyCode) {
        if (this.moveKeys.includes(keyCode)) return
        this.moveKeys.push(keyCode)
        this.checkMovePlayer()
    }

    removeMoveKey(keyCode) {
        const index = this.moveKeys.indexOf(keyCode)
        if (index === -1) return
        this.moveKeys.splice(index, 1)
        this.checkMovePlayer()
    }

    checkMovePlayer() {
        const player = this.dialog.gameView.player
        const last = this.moveKeys[this.moveKeys.length - 1]

        if (!last) {
            player.setMoving(false)
        } else if (last === 'ArrowUp' || last === 'KeyW') {
            player.setDirection(0)
            player.setMoving(true)
        } else if (last === 'ArrowRight' || last === 'KeyD') {
            player.setDirection(1)
            player.setMoving(true)
        } else if (last === 'ArrowDown' || last === 'KeyS') {
            player.setDirection(2)
            player.setMoving(true)
        } else if (last === 'ArrowLeft' || last === 'KeyA') {
            player.setDirection(3)
            player.setMoving(true)
        }
    }

    destroy() {
        this.dialog = null
    }
}
