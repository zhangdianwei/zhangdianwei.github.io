import * as PIXI from 'pixi.js'
import { TankSize } from './TileType.js'

const LifeTime = 10
const WarningTime = 3

export const PowerUpType = {
  STAR: 'star',
  HELMET: 'helmet',
  GRENADE: 'grenade',
  CLOCK: 'clock',
  SHOVEL: 'shovel',
  TANK: 'tank',
}

const textureKeys = {
  [PowerUpType.STAR]: 'itemStar',
  [PowerUpType.HELMET]: 'itemHelmet',
  [PowerUpType.GRENADE]: 'itemGrenade',
  [PowerUpType.CLOCK]: 'itemClock',
  [PowerUpType.SHOVEL]: 'itemShovel',
  [PowerUpType.TANK]: 'itemTank',
}

export default class PlayPowerUp extends PIXI.Container {
  constructor(dialog, type) {
    super()
    this.dialog = dialog
    this.type = type
    this.size = TankSize
    this.elapsed = 0
    this.stateTime = 0
    this.state = 'appearing'
    this.collected = false
    this.lifeTime = LifeTime

    this.sprite = new PIXI.Sprite(dialog.app.textures[textureKeys[type]])
    this.sprite.anchor.set(0.5)
    this.sprite.width = this.size
    this.sprite.height = this.size
    this.addChild(this.sprite)
    this.scale.set(0)
  }

  update(deltaTime) {
    this.elapsed += deltaTime
    this.stateTime += deltaTime
    if (!this.collected) {
      this.lifeTime -= deltaTime
      if (this.lifeTime <= 0) {
        this.dialog.gameView.removePowerUp(this)
        this.destroy({ children: true })
        return
      }
      this.sprite.alpha = this.lifeTime <= WarningTime && Math.floor(this.lifeTime * 6) % 2 === 0 ? 0.25 : 1
    }
    if (this.state === 'appearing') {
      const progress = Math.min(1, this.stateTime / 0.32)
      const value = progress - 1
      const scale = 1 + 2.70158 * value ** 3 + 1.70158 * value ** 2
      this.scale.set(Math.max(0, scale))
      this.rotation = (1 - progress) * -0.16
      if (progress === 1) {
        this.state = 'idle'
        this.stateTime = 0
        this.rotation = 0
      }
      return
    }
    if (this.state === 'idle') {
      this.scale.set(0.96 + Math.sin(this.elapsed * 7) * 0.04)
      return
    }
    if (this.state === 'flight') this.updateFlight()
    if (this.state === 'burst') this.updateBurst()
  }

  collect(player) {
    if (this.collected) return
    this.collected = true
    this.sprite.alpha = 1
    this.dialog.gameView.collectPowerUp(this, player)
  }

  startFlight(target, options, onComplete) {
    const distance = Math.hypot(target.x - this.x, target.y - this.y)
    const arc = options.arc || 0
    this.state = 'flight'
    this.stateTime = 0
    this.flight = {
      startX: this.x,
      startY: this.y,
      startScale: this.scale.x,
      target,
      control1X: this.x + (target.x - this.x) * 0.3,
      control1Y: this.y + (target.y - this.y) * 0.12 - arc,
      control2X: this.x + (target.x - this.x) * 0.72,
      control2Y: this.y + (target.y - this.y) * 0.78 - arc * 0.65,
      pickupDuration: options.pickupDuration || 0.12,
      pickupScale: this.scale.x * 0.6,
      duration: options.duration || Math.max(0.58, Math.min(0.82, distance / 900)),
      tilt: options.tilt || 0,
      startRotation: this.rotation,
      endScale: options.endScale || this.scale.x,
      onComplete,
    }
  }

  startBurst(color, duration, onComplete) {
    this.state = 'burst'
    this.stateTime = 0
    this.burst = { duration, startScale: this.scale.x, onComplete }
    this.ring = new PIXI.Graphics()
    this.ring.lineStyle(5, color, 0.9)
    this.ring.drawCircle(0, 0, this.size * 0.42)
    this.addChildAt(this.ring, 0)
  }

  updateFlight() {
    const data = this.flight
    if (this.stateTime < data.pickupDuration) {
      const progress = this.stateTime / data.pickupDuration
      const eased = progress * progress * (3 - 2 * progress)
      this.scale.set(data.startScale + (data.pickupScale - data.startScale) * eased)
      return
    }
    const progress = Math.min(1, (this.stateTime - data.pickupDuration) / data.duration)
    const eased = progress ** 3 * (progress * (progress * 6 - 15) + 10)
    const rest = 1 - eased
    this.x = rest ** 3 * data.startX + 3 * rest ** 2 * eased * data.control1X +
      3 * rest * eased ** 2 * data.control2X + eased ** 3 * data.target.x
    this.y = rest ** 3 * data.startY + 3 * rest ** 2 * eased * data.control1Y +
      3 * rest * eased ** 2 * data.control2Y + eased ** 3 * data.target.y
    this.rotation = data.startRotation * rest + Math.sin(eased * Math.PI) * data.tilt
    this.scale.set(data.pickupScale + (data.endScale - data.pickupScale) * eased)
    if (progress === 1) {
      this.state = 'arrived'
      this.rotation = 0
      this.scale.set(data.endScale)
      data.onComplete()
    }
  }

  updateBurst() {
    const data = this.burst
    const progress = Math.min(1, this.stateTime / data.duration)
    this.scale.set(data.startScale * (1 + progress * 1.5))
    this.alpha = 1 - progress
    this.rotation = progress * Math.PI * 0.5
    this.ring.scale.set(0.8 + progress * 1.5)
    if (progress === 1) data.onComplete()
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.size, height: this.size }
  }
}
