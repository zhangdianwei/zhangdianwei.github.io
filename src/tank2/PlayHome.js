import * as PIXI from 'pixi.js'
import { TileSize } from './TileType.js'

export default class PlayHome extends PIXI.Container {
  constructor(dialog) {
    super()

    this.dialog = dialog
    this.app = dialog.app

    this.isDead = false
    this.size = TileSize * 2

    this.sprite = new PIXI.Sprite(this.app.textures.homeIntact)
    this.sprite.width = this.size
    this.sprite.height = this.size
    this.sprite.anchor.set(0.5, 0.5)
    this.addChild(this.sprite)
  }

  takeDamage() {
    if (this.isDead) return

    this.isDead = true
    this.sprite.texture = this.app.textures.homeDestroyed
    this.dialog.gameView.addEffect('tankExplode', this.x, this.y, () => {
      this.dialog.ruleMgr.onHomeDeadFinish(this)
    })
  }

  getBounds() {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size,
    }
  }

  checkCollision(x, y) {
    const bounds = this.getBounds()
    return x >= bounds.x && x <= bounds.x + bounds.width &&
      y >= bounds.y && y <= bounds.y + bounds.height
  }
}
