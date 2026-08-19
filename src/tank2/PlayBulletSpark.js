import * as PIXI from 'pixi.js'
import { TileSize } from './TileType.js'

const colors = [0xFFF4B0, 0xFFD34D, 0xFF8A3D]

export default class PlayBulletSpark extends PIXI.Container {
  constructor(onComplete) {
    super()
    this.life = 0.28
    this.elapsed = 0
    this.onComplete = onComplete
    this.ring = new PIXI.Graphics()
    this.ring.lineStyle(2, 0xFF9D32, 0.9)
    this.ring.drawCircle(0, 0, 5)
    this.addChild(this.ring)
    this.flash = new PIXI.Graphics()
    this.flash.beginFill(0xFFFBE8)
    this.flash.drawPolygon([0, -8, 2, -2, 8, 0, 2, 2, 0, 8, -2, 2, -8, 0, -2, -2])
    this.flash.endFill()
    this.addChild(this.flash)
    this.particles = Array.from({ length: 10 }, (_, index) => {
      const angle = index * Math.PI / 5
      const particle = new PIXI.Graphics()
      particle.beginFill(colors[index % colors.length])
      particle.drawCircle(0, 0, index % 2 ? 2.2 : 1.5)
      particle.endFill()
      this.addChild(particle)
      return {
        particle,
        vx: Math.cos(angle) * TileSize * (2.8 + index % 3 * 0.55),
        vy: Math.sin(angle) * TileSize * (2.8 + index % 3 * 0.55),
      }
    })
  }

  update(deltaTime) {
    this.elapsed += deltaTime
    const progress = Math.min(1, this.elapsed / this.life)
    this.alpha = 1 - progress
    this.flash.scale.set(1.15 - progress * 0.5)
    this.ring.scale.set(0.7 + progress * 2.1)
    this.ring.alpha = 1 - progress
    this.particles.forEach(({ particle, vx, vy }) => {
      particle.position.set(vx * this.elapsed, vy * this.elapsed)
    })
    if (progress < 1) return
    this.removeFromParent()
    this.onComplete?.()
  }
}
