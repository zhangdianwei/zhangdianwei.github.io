import * as PIXI from 'pixi.js'
import Snake from './PlaySnake.js'

export default class PlayerSnake extends Snake {
    constructor(playMgr) {
        super(playMgr)
        this.speedRatio = 1
        this.targetDirectionX = 0
        this.targetDirectionY = 0
        this.lastMouseX = -1
        this.lastMouseY = -1
        this.inputMode = window.matchMedia('(hover: hover) and (pointer: fine)').matches
            ? 'mouse'
            : 'touch'
        // this.setBaseSpeed(3.5);
        this.setName('YOU')
    }

    updateHeadDirectionStrategy() {
        if (this.inputMode === 'touch') return
        const headCube = this.head
        const globalMousePosition = this.playMgr.app.pixi.renderer.events.pointer.global
        const boostPosition = this.playMgr.speedBoost?.getGlobalPosition(new PIXI.Point(), false)
        if (
            boostPosition &&
            Math.hypot(
                globalMousePosition.x - boostPosition.x,
                globalMousePosition.y - boostPosition.y,
            ) < 72
        ) {
            return
        }
        const localMouseInRoot = this.playMgr.root.toLocal(globalMousePosition)
        const headPositionInRoot = this.playMgr.root.toLocal(
            headCube.getGlobalPosition(new PIXI.Point(), false),
        )
        const mouseMovedThreshold = 1
        if (
            Math.abs(localMouseInRoot.x - this.lastMouseX) > mouseMovedThreshold ||
            Math.abs(localMouseInRoot.y - this.lastMouseY) > mouseMovedThreshold ||
            this.lastMouseX === -1
        ) {
            const dx = localMouseInRoot.x - headPositionInRoot.x
            const dy = localMouseInRoot.y - headPositionInRoot.y
            const len = Math.sqrt(dx * dx + dy * dy)
            if (len > 0.01) {
                this.setHeadDirection(dx / len, dy / len)
            }
            this.lastMouseX = localMouseInRoot.x
            this.lastMouseY = localMouseInRoot.y
        }
    }

    useTouchInput() {
        this.inputMode = 'touch'
    }

    useMouseInput() {
        if (this.inputMode === 'mouse') return
        this.inputMode = 'mouse'
        this.lastMouseX = -1
        this.lastMouseY = -1
    }

    onHeadValueChanged() {
        this.playMgr.app.data.playerRank.level = this.head.level
    }
}
