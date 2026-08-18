import * as PIXI from 'pixi.js'
import { TankSize } from './TileType.js'

export default class PlayHome extends PIXI.Container {
  constructor(dialog) {
    super()

    this.dialog = dialog
    this.app = dialog.app

    this.isDead = false
    this.size = TankSize

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
      x: this.x,
      y: this.y,
      width: this.size,
      height: this.size,
    }
  }

  getOccupancyBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.size,
      height: this.size,
    }
  }

  checkCollision(x, y) {
    const bounds = this.getBounds()
    return Math.abs(x - bounds.x) <= bounds.width / 2 &&
      Math.abs(y - bounds.y) <= bounds.height / 2
  }
}
