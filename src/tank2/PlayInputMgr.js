import { TouchGamepad } from '../game-guide/index.js'

const CodeToDir = {
    ArrowUp: 0, KeyW: 0,
    ArrowRight: 1, KeyD: 1,
    ArrowDown: 2, KeyS: 2,
    ArrowLeft: 3, KeyA: 3,
}

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0

function codeToDir(code) {
    return code.startsWith('Touch') ? Number(code.slice(5)) : CodeToDir[code]
}

export default class PlayInputMgr {
    init(dialog) {
        this.dialog = dialog
        this.moveKeys = []

        dialog.event(window, 'keydown', (event) => this.keyDown(event.code))
        dialog.event(window, 'keyup', (event) => this.keyUp(event.code))

        if (isTouchDevice()) {
            this.gamepad = new TouchGamepad({
                buttons: ['A'],
                baseRadius: 135,
                stickRadius: 58,
                maxDistance: 102,
                buttonRadius: 100,
                floatingJoystick: true,
                onDirDown: (dir) => this.addMoveKey(`Touch${dir}`),
                onDirUp: (dir) => this.removeMoveKey(`Touch${dir}`),
                onButtonDown: () => this.setShooting(true),
                onButtonUp: () => this.setShooting(false),
            })
            dialog.addChild(this.gamepad)
        }
    }

    keyDown(keyCode) {
        if (!this.dialog.gameView.player) return

        if (codeToDir(keyCode) !== undefined) {
            this.addMoveKey(keyCode)
        } else if (keyCode === 'Space') {
            this.setShooting(true)
        }
    }

    keyUp(keyCode) {
        if (!this.dialog.gameView.player) return

        if (codeToDir(keyCode) !== undefined) {
            this.removeMoveKey(keyCode)
        } else if (keyCode === 'Space') {
            this.setShooting(false)
        }
    }

    setShooting(shooting) {
        this.dialog.gameView.player?.setShooting(shooting)
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
        if (!player) return

        const last = this.moveKeys[this.moveKeys.length - 1]
        if (last === undefined) {
            player.setMoving(false)
        } else {
            player.setDirection(codeToDir(last))
            player.setMoving(true)
        }
    }

    layout(screen, slots) {
        this.gamepad?.layout(screen, slots)
    }

    destroy() {
        this.gamepad = null
        this.dialog = null
    }
}
