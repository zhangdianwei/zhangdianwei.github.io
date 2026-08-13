import * as PIXI from 'pixi.js'
import { theme } from './theme.js'

export default class BallGameButton extends PIXI.Container {
  constructor(label, action, color = theme.primary) {
    super()
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.hitArea = new PIXI.Rectangle(-150, -34, 300, 68)

    const background = new PIXI.Graphics()
    background.beginFill(color)
    background.drawRoundedRect(-150, -34, 300, 68, 8)
    background.endFill()
    this.addChild(background)

    const text = new PIXI.Text(label, {
      fontFamily: theme.fontFamily,
      fontSize: 26,
      fontWeight: 'bold',
      fill: theme.background,
    })
    text.anchor.set(0.5)
    this.addChild(text)

    this.on('pointerdown', () => this.scale.set(0.96))
    this.on('pointerup', () => this.scale.set(1))
    this.on('pointerupoutside', () => this.scale.set(1))
    this.on('pointertap', action)
  }
}
