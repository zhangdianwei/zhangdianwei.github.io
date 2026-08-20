import * as PIXI from 'pixi.js'
import { BulletLevelConfig, moveByDir, TankType, TileSize } from './TileType.js'

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
    this.power = owner.power
    this.level = owner.bulletLevel
    this.brickDamage = BulletLevelConfig[this.level].brickDamage
    this.breaksIron = BulletLevelConfig[this.level].breaksIron
    this.speed = owner.bulletSpeed
    this.size = TileSize * 0.4

    this.x = this.owner.x
    this.y = this.owner.y
    moveByDir(this, this.direction, owner.size / 2 + this.size / 2)

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

  getBrickDamage() {
    return this.brickDamage
  }

  canBreakIron() {
    return this.breaksIron
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
    if (this.isDead) return
    moveByDir(this, this.direction, this.speed * deltaTime)

    if (!this.dialog.ruleMgr.isInBounds(this.x, this.y)) {
      this.hit()
    }
  }

  hit() {
    if (this.isDead) return
    this.app.audioMgr.play('hit', { volume: 0.45, rate: 0.8, maxVoices: 3 })
    this.dialog.gameView.addBulletSpark(this.x, this.y)
    this.makeDead()
  }

  makeDead() {
    if (this.isDead) return
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
