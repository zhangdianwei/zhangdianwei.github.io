import * as PIXI from 'pixi.js'
import { TileSize } from './TileType.js'

const colors = [0xFFF4B0, 0xFFD34D, 0xFF8A3D]

export default class PlayBulletSpark extends PIXI.Container {
  constructor(onComplete) {
    super()
    this.life = 0.18
    this.elapsed = 0
    this.onComplete = onComplete
    this.flash = new PIXI.Graphics()
    this.flash.beginFill(0xFFFBE8)
    this.flash.drawPolygon([0, -4, 1, -1, 4, 0, 1, 1, 0, 4, -1, 1, -4, 0, -1, -1])
    this.flash.endFill()
    this.addChild(this.flash)
    this.particles = Array.from({ length: 6 }, (_, index) => {
      const angle = index * Math.PI / 3
      const particle = new PIXI.Graphics()
      particle.beginFill(colors[index % colors.length])
      particle.drawRect(-1, -1, index % 2 ? 3 : 2, index % 2 ? 3 : 2)
      particle.endFill()
      this.addChild(particle)
      return {
        particle,
        vx: Math.cos(angle) * TileSize * (2.1 + index % 2 * 0.8),
        vy: Math.sin(angle) * TileSize * (2.1 + index % 2 * 0.8),
      }
    })
  }

  update(deltaTime) {
    this.elapsed += deltaTime
    const progress = Math.min(1, this.elapsed / this.life)
    this.alpha = 1 - progress
    this.flash.scale.set(1 - progress * 0.45)
    this.particles.forEach(({ particle, vx, vy }) => {
      particle.position.set(vx * this.elapsed, vy * this.elapsed)
    })
    if (progress < 1) return
    this.removeFromParent()
    this.onComplete?.()
  }
}
