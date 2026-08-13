import * as PIXI from 'pixi.js'

export default class BallGameBackdrop extends PIXI.Container {
  constructor(texture, count = 28) {
    super()
    this.stars = Array.from({ length: count }, () => {
      const sprite = new PIXI.Sprite(texture)
      sprite.anchor.set(0.5)
      sprite.alpha = 0.18 + Math.random() * 0.35
      sprite.scale.set(0.2 + Math.random() * 0.45)
      sprite.starX = Math.random()
      sprite.starY = Math.random()
      return this.addChild(sprite)
    })
  }

  layout(screen) {
    this.stars.forEach((star) => {
      star.position.set(star.starX * screen.width, star.starY * screen.height)
    })
  }
}
