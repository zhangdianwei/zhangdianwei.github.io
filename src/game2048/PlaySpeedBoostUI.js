import * as PIXI from 'pixi.js'
import { makeButton } from './Game2048UI.js'

const BOOST_DURATION = 4000
const RING_SEGMENTS = 128

function drawRing(graphics, progress, color) {
    if (progress <= 0) return
    const start = -Math.PI / 2
    const angle = Math.PI * 2 * Math.min(1, progress)
    const segments = Math.max(2, Math.ceil(RING_SEGMENTS * Math.min(1, progress)))
    const points = []
    for (let i = 0; i <= segments; i++) {
        const value = start + angle * i / segments
        points.push(Math.cos(value) * 55.5, Math.sin(value) * 55.5)
    }
    for (let i = segments; i >= 0; i--) {
        const value = start + angle * i / segments
        points.push(Math.cos(value) * 48.5, Math.sin(value) * 48.5)
    }
    graphics.beginFill(color)
    graphics.drawPolygon(points)
    graphics.endFill()
}

export default class SpeedBoostUI extends PIXI.Container {
    constructor(playerSnake) {
        super()
        this.playerSnake = playerSnake
        this.charge = 100
        this.activeTime = 0
        this.lastCharge = -1
        this.lastActive = false
        this.button = new PIXI.Graphics()
        this.ring = new PIXI.Graphics()
        this.icon = new PIXI.Graphics()
        this.addChild(this.button, this.ring, this.icon)
        this.hitArea = new PIXI.Circle(0, 0, 56)
        makeButton(this, () => this.activate())
        this.draw()
    }

    activate() {
        if (this.charge < 100 || this.activeTime > 0) return
        this.charge = 0
        this.activeTime = BOOST_DURATION
        this.playerSnake.speedRatio = 1.9
        this.draw()
    }

    addCharge(value) {
        if (this.activeTime > 0) return
        this.charge = Math.min(100, this.charge + value)
        this.draw()
    }

    update(delta) {
        const dt = delta?.deltaMS || 16
        if (this.activeTime > 0) {
            this.activeTime = Math.max(0, this.activeTime - dt)
            if (!this.activeTime) this.playerSnake.speedRatio = 1
        } else {
            this.charge = Math.min(100, this.charge + dt / 90)
        }
        this.draw()
    }

    draw() {
        const charge = Math.floor(this.charge)
        const active = this.activeTime > 0
        const progress = active ? this.activeTime / BOOST_DURATION : this.charge / 100
        const frame = Math.floor(progress * 100)
        if (frame === this.lastCharge && active === this.lastActive) return
        this.lastCharge = frame
        this.lastActive = active
        const ready = this.charge >= 100
        this.button.clear()
        this.button.beginFill(0x4a4f54)
        this.button.drawCircle(0, 0, 55.5)
        this.button.beginFill(ready ? 0x153a2c : 0x25292d, 0.96)
        this.button.drawCircle(0, 0, 47)
        this.button.endFill()
        this.ring.clear()
        drawRing(this.ring, progress, active || ready ? 0x75db4d : 0x8b9298)
        this.icon.clear()
        this.icon.beginFill(active || ready ? 0x9cff57 : 0x8b9298)
        this.icon.drawPolygon([-7, -28, 18, -28, 5, -4, 21, -4, -17, 31, -5, 7, -22, 7])
        this.icon.endFill()
        this.alpha = 1
        this.cursor = ready ? 'pointer' : 'default'
    }

    destroy(options) {
        if (this.playerSnake) this.playerSnake.speedRatio = 1
        this.playerSnake = null
        super.destroy(options)
    }
}
