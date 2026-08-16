import * as PIXI from 'pixi.js'
import { moveByDir, TankType, TileSize } from './TileType.js'

export const BulletType = {
  PLAYER: 'player',
  ENEMY: 'enemy',
}

export default class PlayBullet extends PIXI.Container {
  constructor(dialog, owner) {
    super()

    this.dialog = dialog
    this.app = dialog.app

    this.owner = owner
    this.bulletType = owner.tankType === TankType.PLAYER ? BulletType.PLAYER : BulletType.ENEMY
    this.direction = owner.direction
    this.power = 1
    this.speed = 300
    this.size = TileSize * 0.625

    this.x = this.owner.x
    this.y = this.owner.y

    this.createSprite()

    this.dialog.gameView.addBullet(this)
    this.owner.onBulletAdded?.(this)
  }

  getPower() {
    return this.power
  }

  setPower(power) {
    this.power = power
  }

  createSprite() {
    const graphics = new PIXI.Graphics()
    graphics.beginFill(this.bulletType === BulletType.PLAYER ? 0x00FF00 : 0xFF0000)
    graphics.drawRect(-this.size / 2, -this.size / 2, this.size, this.size)
    graphics.endFill()

    this.sprite = graphics
    this.addChild(this.sprite)

    this.sprite.rotation = (this.direction * 90) * Math.PI / 180
  }

  update(deltaTime) {
    moveByDir(this, this.direction, this.speed * deltaTime)

    if (!this.dialog.ruleMgr.isInBounds(this.x, this.y)) {
      this.makeDead()
    }
  }

  makeDead() {
    this.isDead = true
    this.visible = false

    this.owner?.onBulletDestroyed?.()
    this.dialog.ruleMgr.onBulletDeadFinish(this)
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.size,
      height: this.size,
    }
  }
}
