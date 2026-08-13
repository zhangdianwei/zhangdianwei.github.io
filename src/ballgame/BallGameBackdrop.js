import * as PIXI from 'pixi.js'
import { theme } from './theme.js'

export default class BallGameBackdrop extends PIXI.Container {
  constructor(texture, count = 28) {
    super()
    this.time = 0
    this.decor = this.addChild(new PIXI.Graphics())
    this.stars = Array.from({ length: count }, () => {
      const sprite = new PIXI.Sprite(texture)
      sprite.anchor.set(0.5)
      sprite.baseAlpha = 0.14 + Math.random() * 0.32
      sprite.scale.set(0.2 + Math.random() * 0.45)
      sprite.starX = Math.random()
      sprite.starY = Math.random()
      sprite.phase = Math.random() * Math.PI * 2
      return this.addChild(sprite)
    })
  }

  layout(screen) {
    this.screen = screen
    this.decor.clear()
    this.decor.beginFill(theme.surface, 0.22)
    this.decor.drawRect(0, 0, screen.width, 96)
    this.decor.endFill()
    this.decor.lineStyle(1, theme.border, 0.18)
    for (let y = 150; y < screen.height; y += 120) {
      this.decor.moveTo(0, y)
      this.decor.lineTo(screen.width, y)
    }
    this.stars.forEach((star) => {
      star.position.set(star.starX * screen.width, star.starY * screen.height)
    })
  }

  update(delta) {
    if (!this.screen) return
    this.time += delta / 60
    this.stars.forEach((star) => {
      star.alpha = star.baseAlpha * (0.72 + Math.sin(this.time * 1.8 + star.phase) * 0.28)
      star.y = (star.starY * this.screen.height + this.time * (3 + star.scale.x * 5)) % this.screen.height
    })
  }
}
