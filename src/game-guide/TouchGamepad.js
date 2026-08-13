import * as PIXI from 'pixi.js'

export const GamepadDir = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 }

const RestAlpha = 0.5
const PressedAlpha = 0.9
const TouchPointerTypes = ['touch', 'pen']
const JoystickDeadZone = 16

export default class TouchGamepad extends PIXI.Container {
  constructor(options = {}) {
    super()

    const { buttons = ['A'], onDirDown, onDirUp, onButtonDown, onButtonUp } = options
    this.onDirDown = onDirDown
    this.onDirUp = onDirUp
    this.onButtonDown = onButtonDown
    this.onButtonUp = onButtonUp

    this.buttonRadius = 60
    this.baseRadius = 95
    this.stickRadius = 42
    this.maxDistance = 72
    this.joystickAnchor = { x: 0, y: 0 }

    this.createJoystick()

    this.actionButtons = {}
    buttons.forEach((label) => {
      const btn = this.createActionButton(label)
      this.actionButtons[label] = btn
      this.addChild(btn)
    })
  }

  createJoystick() {
    // 视觉层：固定摆在锚点位置，不参与命中测试
    this.joystickVisual = this.addChild(new PIXI.Container())

    this.joystickBase = new PIXI.Graphics()
    this.joystickBase.beginFill(0xFFFFFF, 0.2)
    this.joystickBase.drawCircle(0, 0, this.baseRadius)
    this.joystickBase.beginFill(0xFFFFFF, 0.1)
    this.joystickBase.drawCircle(0, 0, this.baseRadius - 12)
    this.joystickBase.endFill()
    this.joystickVisual.addChild(this.joystickBase)

    this.joystickStick = new PIXI.Graphics()
    this.joystickStick.beginFill(0xFFFFFF, 0.6)
    this.joystickStick.drawCircle(0, 0, this.stickRadius)
    this.joystickStick.endFill()
    this.joystickVisual.addChild(this.joystickStick)

    // 命中层：留在原点不做位移，hitArea 用屏幕绝对坐标，保证手指拖出底座范围也能继续跟踪
    this.joystickHit = this.addChild(new PIXI.Container())
    this.joystickHit.eventMode = 'static'
    this.joystickHit.cursor = 'pointer'

    this.joystickPointerId = null
    this.joystickDir = null

    this.joystickHit.on('pointerdown', (event) => this.onJoystickDown(event))
    this.joystickHit.on('pointermove', (event) => this.onJoystickMove(event))
    this.joystickHit.on('pointerup', (event) => this.onJoystickUp(event))
    this.joystickHit.on('pointerupoutside', (event) => this.onJoystickUp(event))
    this.joystickHit.on('pointercancel', (event) => this.onJoystickUp(event))
  }

  onJoystickDown(event) {
    if (!TouchPointerTypes.includes(event.pointerType) || this.joystickPointerId !== null) return

    const { x: dx, y: dy } = this.toAnchorOffset(event)
    if (Math.hypot(dx, dy) > this.baseRadius * 1.6) return

    this.joystickPointerId = event.pointerId
    this.updateStick(dx, dy)
    event.stopPropagation()
  }

  onJoystickMove(event) {
    if (event.pointerId !== this.joystickPointerId) return
    const { x: dx, y: dy } = this.toAnchorOffset(event)
    this.updateStick(dx, dy)
    event.stopPropagation()
  }

  onJoystickUp(event) {
    if (event.pointerId !== this.joystickPointerId) return
    this.joystickPointerId = null
    this.joystickStick.position.set(0, 0)
    this.setJoystickDir(null)
  }

  toAnchorOffset(event) {
    const point = this.joystickHit.toLocal(event.global)
    return { x: point.x - this.joystickAnchor.x, y: point.y - this.joystickAnchor.y }
  }

  updateStick(dx, dy) {
    const distance = Math.hypot(dx, dy)
    const ratio = distance > this.maxDistance ? this.maxDistance / distance : 1
    this.joystickStick.position.set(dx * ratio, dy * ratio)

    const dir = distance > JoystickDeadZone
      ? (Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? GamepadDir.RIGHT : GamepadDir.LEFT)
        : (dy > 0 ? GamepadDir.DOWN : GamepadDir.UP))
      : null
    this.setJoystickDir(dir)
  }

  setJoystickDir(dir) {
    if (this.joystickDir === dir) return
    if (this.joystickDir !== null) this.onDirUp?.(this.joystickDir)
    this.joystickDir = dir
    if (this.joystickDir !== null) this.onDirDown?.(this.joystickDir)
  }

  createActionButton(label) {
    const btn = new PIXI.Container()
    const r = this.buttonRadius

    const bg = new PIXI.Graphics()
    bg.beginFill(0xFFFFFF, 0.25)
    bg.drawCircle(0, 0, r)
    bg.endFill()
    btn.addChild(bg)

    const text = new PIXI.Text(label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: r,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
    })
    text.anchor.set(0.5)
    text.alpha = 0.9
    btn.addChild(text)

    this.bindPress(btn, {
      onDown: () => this.onButtonDown?.(label),
      onUp: () => this.onButtonUp?.(label),
    })

    return btn
  }

  bindPress(btn, { onDown, onUp }) {
    btn.eventMode = 'static'
    btn.cursor = 'pointer'
    btn.alpha = RestAlpha

    let pointerId = null

    btn.on('pointerdown', (event) => {
      if (!TouchPointerTypes.includes(event.pointerType) || pointerId !== null) return
      pointerId = event.pointerId
      btn.alpha = PressedAlpha
      onDown()
      event.stopPropagation()
    })

    const release = (event) => {
      if (event.pointerId !== pointerId) return
      pointerId = null
      btn.alpha = RestAlpha
      onUp()
      event.stopPropagation()
    }
    btn.on('pointerup', release)
    btn.on('pointerupoutside', release)
    btn.on('pointercancel', release)
  }

  layout(screen) {
    const margin = 28

    this.joystickHit.hitArea = new PIXI.Rectangle(0, 0, screen.width, screen.height)
    this.joystickAnchor.x = margin + this.baseRadius
    this.joystickAnchor.y = screen.height - margin - this.baseRadius
    this.joystickVisual.position.set(this.joystickAnchor.x, this.joystickAnchor.y)

    const labels = Object.keys(this.actionButtons)
    labels.forEach((label, index) => {
      const btn = this.actionButtons[label]
      const x = screen.width - margin - this.buttonRadius - index * (this.buttonRadius * 2.1)
      const y = screen.height - margin - this.buttonRadius - (index % 2 === 1 ? this.buttonRadius * 1.3 : 0)
      btn.position.set(x, y)
    })
  }
}
