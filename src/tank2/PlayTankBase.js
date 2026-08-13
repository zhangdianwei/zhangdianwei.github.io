import * as PIXI from 'pixi.js'
import { createSpriteSeqAnim } from './PlaySpriteSeqAnim.js'
import { Dir, moveByDir, TileSize, TankType, TankConfig } from './TileType.js'
import PlayBullet from './PlayBullet.js'

export default class PlayTankBase extends PIXI.Container {
  constructor(dialog, tankType) {
    super()

    this.dialog = dialog
    this.app = dialog.app

    this.tankType = tankType
    this.direction = Dir.UP
    this.size = 64

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
    if (this.direction !== direction) {
      this.checkCorrectPath()
    }
    this.direction = direction
    this.tankSprites.forEach((sprite) => { sprite.rotation = direction * (Math.PI / 2) })
  }

  setMoving(moving) {
    this.isMoving = moving
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

  checkCorrectPath() {
    const size = TileSize / 2
    this.x = Math.round(this.x / size) * size
    this.y = Math.round(this.y / size) * size
  }

  checkMoving(deltaTime) {
    if (this.isMoving) {
      const allowedMap = this.dialog.gameView.map.getMovableDistance(this.getBounds(), this.direction)
      const allowedTank = this.dialog.ruleMgr.getMovableDistance(this.getBounds(), this.direction, this)
      const clampedMap = Number.isFinite(allowedMap) ? Math.max(0, Math.floor(allowedMap)) : allowedMap
      const clampedTank = Number.isFinite(allowedTank) ? Math.max(0, Math.floor(allowedTank)) : allowedTank
      const allowed = Math.min(clampedMap, clampedTank)
      const frameSpeed = Math.floor(this.speed * deltaTime)
      const movable = Math.min(allowed, frameSpeed)

      if (movable > 0) {
        moveByDir(this, this.direction, movable)
      }

      this.animationTimer += deltaTime
      if (this.animationTimer >= this.animationSpeed) {
        this.animationTimer = 0
        this.enterNextFrame()
      }
    }
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
}
