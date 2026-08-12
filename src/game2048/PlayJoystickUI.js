import * as PIXI from 'pixi.js'

const BASE_RADIUS = 72
const STICK_RADIUS = 25
const MAX_DISTANCE = 58
const DEAD_ZONE = 10

export default class JoystickUI extends PIXI.Container {
    constructor(playerSnake) {
        super()
        this.playerSnake = playerSnake
        this.pointerId = null
        this.origin = new PIXI.Point()
        this.base = new PIXI.Graphics()
        this.stick = new PIXI.Graphics()
        this.addChild(this.base, this.stick)
        this.draw()
        this.hideStick()
        this.eventMode = 'static'
        this.on('pointerdown', this.onPointerDown, this)
        this.on('pointermove', this.onPointerMove, this)
        this.on('pointerup', this.onPointerUp, this)
        this.on('pointerupoutside', this.onPointerUp, this)
        this.on('pointercancel', this.onPointerUp, this)
    }

    draw() {
        this.base.beginFill(0x111820, 0.48)
        this.base.drawCircle(0, 0, BASE_RADIUS)
        this.base.beginFill(0xffffff, 0.12)
        this.base.drawCircle(0, 0, BASE_RADIUS - 8)
        this.base.endFill()
        this.stick.beginFill(0x17251d, 0.94)
        this.stick.drawCircle(0, 0, STICK_RADIUS + 5)
        this.stick.beginFill(0x75db4d)
        this.stick.drawCircle(0, 0, STICK_RADIUS)
        this.stick.endFill()
    }

    resize(screen) {
        this.hitArea = new PIXI.Rectangle(0, 0, screen.width, screen.height)
    }

    onPointerDown(event) {
        if (!['touch', 'pen'].includes(event.pointerType) || this.pointerId !== null) return
        const point = this.toLocal(event.global)
        this.pointerId = event.pointerId
        this.origin.copyFrom(point)
        this.base.position.copyFrom(point)
        this.stick.position.copyFrom(point)
        this.base.visible = true
        this.stick.visible = true
        this.playerSnake?.useTouchInput()
        event.stopPropagation()
    }

    onPointerMove(event) {
        if (event.pointerType === 'mouse') {
            this.playerSnake?.useMouseInput()
            return
        }
        if (event.pointerId !== this.pointerId) return
        const point = this.toLocal(event.global)
        const dx = point.x - this.origin.x
        const dy = point.y - this.origin.y
        const distance = Math.hypot(dx, dy)
        const ratio = distance > MAX_DISTANCE ? MAX_DISTANCE / distance : 1
        this.stick.position.set(this.origin.x + dx * ratio, this.origin.y + dy * ratio)
        if (distance > DEAD_ZONE) this.playerSnake?.setHeadDirection(dx, dy)
        event.stopPropagation()
    }

    onPointerUp(event) {
        if (event.pointerId !== this.pointerId) return
        this.release()
        event.stopPropagation()
    }

    release() {
        this.pointerId = null
        this.hideStick()
    }

    hideStick() {
        this.base.visible = false
        this.stick.visible = false
    }

    destroy(options) {
        this.release()
        this.playerSnake = null
        super.destroy(options)
    }
}
