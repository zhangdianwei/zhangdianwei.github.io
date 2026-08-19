import * as PIXI from 'pixi.js'
import { TankSize } from './TileType.js'

export const PowerUpType = {
  STAR: 'star',
  HELMET: 'helmet',
  GRENADE: 'grenade',
  CLOCK: 'clock',
  SHOVEL: 'shovel',
  TANK: 'tank',
}

export const PowerUpTypes = Object.values(PowerUpType)

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
    this.dialog.gameView.collectPowerUp(this, player)
  }

  startFlight(target, options, onComplete) {
    this.state = 'flight'
    this.stateTime = 0
    this.flight = {
      startX: this.x,
      startY: this.y,
      startScale: this.scale.x,
      target,
      duration: options.duration || 0.55,
      arc: options.arc || 0,
      turns: options.turns || 0,
      endScale: options.endScale || this.scale.x * 0.6,
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
    const progress = Math.min(1, this.stateTime / data.duration)
    const eased = 1 - (1 - progress) ** 3
    this.x = data.startX + (data.target.x - data.startX) * eased
    this.y = data.startY + (data.target.y - data.startY) * eased - Math.sin(progress * Math.PI) * data.arc
    this.rotation = progress * Math.PI * 2 * data.turns
    this.scale.set(data.startScale + (data.endScale - data.startScale) * eased)
    if (progress === 1) data.onComplete()
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
