import * as PIXI from 'pixi.js'
import { createSpriteSeqAnim } from './PlaySpriteSeqAnim.js'
import {
  Dir,
  moveByDir,
  TankBoundaryThreshold,
  TankConfig,
  TankPositionStep,
  TankSize,
  TankType,
} from './TileType.js'
import PlayBullet from './PlayBullet.js'

export default class PlayTankBase extends PIXI.Container {
  constructor(dialog, tankType) {
    super()

    this.dialog = dialog
    this.app = dialog.app

    this.tankType = tankType
    this.direction = Dir.UP
    this.size = TankSize
    this.occupancySize = TankSize - TankBoundaryThreshold * 2

    this.isMoving = false
    this.isShooting = false
    this.shootOnce = false

    this.invincibleTime = 0

    this.currentFrame = 0
    this.animationTimer = 0
    this.animationSpeed = 0.15

    this.shootTimer = 0
    this.shootCooldown = 0.15

    this.maxBullets = 1
    this.currentBullets = 0

    this.appearAnim = null

    this.initByTankType(tankType)
  }

  initByTankType(tankType) {
    this.tankType = tankType

    const config = TankConfig[tankType] || TankConfig[TankType.PLAYER]
    this.speed = config.speed
    this.health = config.health
    this.power = config.power

    this.initSprites()
  }

  initSprites() {
    this.tankSprites = []

    const keys = this.tankType === TankType.PLAYER
      ? ['playerRun1', 'playerRun2']
      : [`enemy${this.tankType}Run1`, `enemy${this.tankType}Run2`]

    keys.forEach((key) => {
      const sprite = new PIXI.Sprite(this.app.textures[key])
      sprite.anchor.set(0.5)
      sprite.width = this.size
      sprite.height = this.size
      sprite.visible = false
      this.tankSprites.push(sprite)
      this.addChild(sprite)
    })
  }

  appear() {
    this.setInvincible()
    this.appearAnim = createSpriteSeqAnim(this.app, 'tankAppear', () => {
      this.appearAnim = null
      this.onAppearFinish()
    })
    this.addChild(this.appearAnim)
  }

  onAppearFinish() {
    this.setInvincible(false)
    this.enterNextFrame()
  }

  isInvincible() {
    return this.invincibleTime > 0
  }

  setInvincible(invincibleTime = 3) {
    this.invincibleTime = invincibleTime
  }

  setDirection(direction) {
    if (this.direction !== direction) this.normalizePosition()
    this.direction = direction
    this.tankSprites.forEach((sprite) => { sprite.rotation = direction * (Math.PI / 2) })
  }

  setMoving(moving) {
    this.isMoving = moving
  }

  normalizePosition() {
    const vertical = this.direction === Dir.UP || this.direction === Dir.DOWN
    const position = vertical ? this.y : this.x
    const target = Math.round(position / TankPositionStep) * TankPositionStep
    const offset = target - position
    if (Math.abs(offset) < 0.000001) return
    const direction = vertical
      ? (offset < 0 ? Dir.UP : Dir.DOWN)
      : (offset < 0 ? Dir.LEFT : Dir.RIGHT)
    const distance = Math.min(Math.abs(offset), this.getAllowedDistance(direction))
    if (distance > 0) moveByDir(this, direction, distance)
  }

  setShooting(shooting) {
    this.isShooting = shooting
  }

  setShootOnce() {
    this.shootOnce = true
  }

  shoot() {
    return new PlayBullet(this.dialog, this)
  }

  onBulletAdded() {
    this.currentBullets++
  }

  onBulletDestroyed() {
    if (this.currentBullets > 0) {
      this.currentBullets--
    }
  }

  checkMoving(deltaTime) {
    if (!this.isMoving) return

    const planned = this.speed * deltaTime
    const movable = Math.min(planned, this.getAllowedDistance(this.direction))
    if (movable > 0) moveByDir(this, this.direction, movable)

    if (movable <= 0) return
    this.animationTimer += deltaTime
    if (this.animationTimer >= this.animationSpeed) {
      this.animationTimer = 0
      this.enterNextFrame()
    }
  }

  getAllowedDistance(direction) {
    const bounds = this.getOccupancyBounds()
    const allowedMap = this.dialog.gameView.map.getMovableDistance(bounds, direction)
    const allowedTank = this.dialog.ruleMgr.getMovableDistance(bounds, direction, this)
    return Math.max(0, Math.min(allowedMap, allowedTank))
  }

  checkShooting(deltaTime) {
    if (this.shootTimer > 0) {
      this.shootTimer -= deltaTime
    }

    if (this.shootTimer > 0) return
    if (this.currentBullets >= this.maxBullets) return

    if (this.isShooting || this.shootOnce) {
      this.shootOnce = false
      this.shootTimer = this.shootCooldown
      this.shoot()
    }
  }

  checkInvincible(deltaTime) {
    if (this.invincibleTime > 0) {
      this.invincibleTime -= deltaTime
      this.alpha = Math.sin(Date.now() * 0.01) > 0 ? 1 : 0.5
    } else {
      this.alpha = 1
    }
  }

  takeDamage(damage) {
    if (this.invincibleTime > 0) return

    this.health -= damage
    if (this.health <= 0) {
      this.makeDead()
    }
  }

  makeDead() {
    this.isDead = true
    this.visible = false
    this.dialog.gameView.addEffect('tankExplode', this.x, this.y, () => this.onDeadFinish())
  }

  onDeadFinish() {
    this.dialog.ruleMgr.onTankDeadFinish(this)
  }

  update(deltaTime) {
    if (this.isDead) return
    this.appearAnim?.update(deltaTime)
    this.checkMoving(deltaTime)
    this.checkShooting(deltaTime)
    this.checkInvincible(deltaTime)
  }

  setCurrentFrame(frame) {
    this.tankSprites.forEach((sprite, index) => { sprite.visible = index === frame })
    this.currentFrame = frame
  }

  enterNextFrame() {
    this.setCurrentFrame((this.currentFrame + 1) % this.tankSprites.length)
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
      width: this.occupancySize,
      height: this.occupancySize,
    }
  }
}
