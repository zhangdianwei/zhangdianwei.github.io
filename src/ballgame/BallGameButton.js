import * as PIXI from 'pixi.js'
import { theme } from './theme.js'

export default class BallGameButton extends PIXI.Container {
  constructor(label, action, color = theme.primary) {
    super()
    this.color = color
    this.enabled = true
    this.pressed = false
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.hitArea = new PIXI.Rectangle(-162, -42, 324, 84)

    this.shadow = this.addChild(new PIXI.Graphics())
    this.background = this.addChild(new PIXI.Graphics())
    this.highlight = this.addChild(new PIXI.Graphics())

    this.text = new PIXI.Text(label, {
      fontFamily: theme.fontFamily,
      fontSize: 26,
      fontWeight: 'bold',
      fill: theme.background,
      letterSpacing: 1,
    })
    this.text.anchor.set(0.5)
    this.addChild(this.text)
    this.draw()

    this.on('pointerdown', () => this.setPressed(true))
    this.on('pointerup', () => this.setPressed(false))
    this.on('pointerupoutside', () => this.setPressed(false))
    this.on('pointerover', () => { if (this.enabled) this.background.alpha = 0.9 })
    this.on('pointerout', () => { this.background.alpha = 1 })
    this.on('pointertap', () => { if (this.enabled) action() })
  }

  draw() {
    this.shadow.clear()
    this.shadow.beginFill(0x000000, 0.4)
    this.shadow.drawRoundedRect(-156, -32, 312, 72, 8)
    this.shadow.endFill()
    this.background.clear()
    this.background.lineStyle(2, theme.text, 0.18)
    this.background.beginFill(this.enabled ? this.color : theme.border)
    this.background.drawRoundedRect(-156, -38, 312, 72, 8)
    this.background.endFill()
    this.highlight.clear()
    this.highlight.beginFill(theme.text, this.enabled ? 0.2 : 0.05)
    this.highlight.drawRoundedRect(-142, -29, 284, 3, 2)
    this.highlight.endFill()
  }

  setPressed(pressed) {
    if (!this.enabled || this.pressed === pressed) return
    this.pressed = pressed
    this.scale.set(pressed ? 0.96 : 1)
    this.position.y += pressed ? 4 : -4
  }

  setEnabled(enabled) {
    if (this.pressed) {
      this.position.y -= 4
      this.pressed = false
      this.scale.set(1)
    }
    this.enabled = enabled
    this.eventMode = enabled ? 'static' : 'none'
    this.cursor = enabled ? 'pointer' : 'default'
    this.text.alpha = enabled ? 1 : 0.5
    this.draw()
  }
}
