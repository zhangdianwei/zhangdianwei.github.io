import * as PIXI from 'pixi.js'
import { theme } from './theme.js'

export default class TankButton extends PIXI.Container {
  constructor(app, text, onClick, options = {}) {
    super()
    this.app = app
    this.onClick = onClick

    const {
      width = 220,
      height = 64,
      color = theme.buttonColor,
      fontSize = 22,
    } = options

    this.eventMode = 'static'
    this.cursor = 'pointer'

    this.background = new PIXI.Graphics()
    this.background.beginFill(color)
    this.background.lineStyle(4, 0xFFFFFF, 1)
    this.background.drawRoundedRect(-width / 2, -height / 2, width, height, height * 0.25)
    this.background.endFill()
    this.addChild(this.background)

    this.label = new PIXI.Text(text, {
      fontFamily: theme.fontFamily,
      fontSize,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 3,
      dropShadowDistance: 2,
    })
    this.label.anchor.set(0.5, 0.5)
    this.addChild(this.label)

    this.on('pointerdown', (event) => {
      event.stopPropagation()
      this.scale.set(0.95)
    })
    this.on('pointerup', () => this.scale.set(1))
    this.on('pointerupoutside', () => this.scale.set(1))
    this.on('pointerover', () => { this.background.tint = 0xCCCCCC })
    this.on('pointerout', () => { this.background.tint = 0xFFFFFF })
    this.on('pointertap', (event) => {
      event.stopPropagation()
      this.onClick?.()
    })
  }

  setText(text) {
    this.label.text = text
  }
}
