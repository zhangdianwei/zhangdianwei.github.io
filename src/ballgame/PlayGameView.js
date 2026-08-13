import * as PIXI from 'pixi.js'
import { createTrack, WORLD } from './BallGameData.js'
import { theme } from './theme.js'

export default class PlayGameView extends PIXI.Container {
  constructor(dialog) {
    super()
    this.dialog = dialog
    this.obstacles = []
    this.effects = []
    this.flowDistance = 0
    this.shakeTime = 0
    this.shakePower = 0
    this.trackRoot = this.addChild(new PIXI.Container())
    this.trackShadow = this.trackRoot.addChild(new PIXI.Graphics())
    this.trackBase = this.trackRoot.addChild(new PIXI.Graphics())
    this.trackInner = this.trackRoot.addChild(new PIXI.Graphics())
    this.trackFlow = this.trackRoot.addChild(new PIXI.Graphics())
    this.items = this.addChild(new PIXI.Container())
    this.effectLayer = this.addChild(new PIXI.Container())
  }

  setup(level) {
    this.level = level
    this.track = createTrack(level.path)
    this.drawTrack()

    this.playerRoot = this.items.addChild(new PIXI.Container())
    this.playerGlow = this.playerRoot.addChild(new PIXI.Graphics())
    this.playerGlow.beginFill(theme.primary, 0.2)
    this.playerGlow.drawEllipse(0, 36, 48, 15)
    this.playerGlow.endFill()
    this.player = this.playerRoot.addChild(new PIXI.Sprite(this.dialog.app.textures.playerRun))
    this.player.anchor.set(0.5)
    this.player.scale.set(0.92)
    this.playerRoot.position.copyFrom(this.track.pointAt(0))
    this.facing = 1
    this.turnTime = 0
    return this.track
  }

  drawTrack() {
    const drawLine = (graphics, width, color, alpha) => {
      graphics.clear()
      graphics.lineStyle(width, color, alpha)
      this.track.points.forEach((point, index) => {
        if (index) graphics.lineTo(point.x, point.y)
        else graphics.moveTo(point.x, point.y)
      })
    }

    drawLine(this.trackShadow, 70, theme.trackOuter, 0.78)
    drawLine(this.trackBase, 58, theme.trackBase, 1)
    drawLine(this.trackInner, 5, theme.trackCore, 0.9)

    for (const distance of [0, this.track.total]) {
      const point = this.track.pointAt(distance)
      const pad = new PIXI.Graphics()
      pad.lineStyle(5, theme.border, 1)
      pad.beginFill(theme.surfaceRaised)
      pad.drawCircle(0, 0, 37)
      pad.endFill()
      pad.beginFill(theme.primary, 0.8)
      pad.drawCircle(0, 0, 8)
      pad.endFill()
      pad.position.set(point.x, point.y)
      this.trackRoot.addChild(pad)
    }
  }

  layout(viewport) {
    const scale = Math.min(viewport.width / WORLD.width, viewport.height / WORLD.height)
    this.scale.set(scale)
    this.baseX = viewport.x + (viewport.width - WORLD.width * scale) / 2
    this.baseY = viewport.y + (viewport.height - WORLD.height * scale) / 2
    this.position.set(this.baseX, this.baseY)
  }

  movePlayer(distance, direction, delta) {
    const point = this.track.pointAt(distance)
    this.playerRoot.position.set(point.x, point.y)
    const response = Math.min(1, delta * 0.24)
    this.facing += (direction - this.facing) * response
    const turn = this.turnTime > 0 ? Math.sin(this.turnTime / 0.12 * Math.PI) : 0
    this.player.scale.set(0.92 * this.facing, 0.92 - turn * 0.12)
    this.player.rotation = Math.max(-0.12, Math.min(0.12, point.angle * 0.12)) * direction
    this.playerGlow.alpha = 0.16 + Math.abs(Math.sin(this.flowDistance * 0.025)) * 0.12
  }

  reverse() {
    this.turnTime = 0.12
    this.ripple(this.playerRoot.x, this.playerRoot.y, theme.primary, 55)
  }

  spawn(type) {
    const root = this.items.addChild(new PIXI.Container())
    const halo = root.addChild(new PIXI.Graphics())
    halo.lineStyle(4, type === 'bomb' ? theme.danger : theme.accent, 0.5)
    halo.drawCircle(0, 0, type === 'bomb' ? 50 : 45)
    const sprite = root.addChild(new PIXI.Sprite(this.dialog.app.textures[type]))
    sprite.anchor.set(0.5)
    sprite.scale.set(type === 'bomb' ? 0.92 : 0.9)
    root.position.set(90 + Math.random() * 720, -70)
    const obstacle = { type, root, sprite, halo, age: Math.random() * Math.PI * 2 }
    this.obstacles.push(obstacle)
    return obstacle
  }

  updateObstacle(obstacle, distance, delta) {
    obstacle.age += delta / 60
    obstacle.root.y += distance
    obstacle.root.rotation = Math.sin(obstacle.age * 3) * 0.05
    obstacle.sprite.y = Math.sin(obstacle.age * 5) * 4
    obstacle.halo.alpha = obstacle.type === 'bomb'
      ? 0.28 + Math.sin(obstacle.age * 10) * 0.18
      : 0.2 + Math.sin(obstacle.age * 4) * 0.1
  }

  remove(obstacle) {
    const index = this.obstacles.indexOf(obstacle)
    if (index !== -1) this.obstacles.splice(index, 1)
    obstacle.root.destroy({ children: true })
  }

  collect(obstacle) {
    const { x, y } = obstacle.root
    this.remove(obstacle)
    this.burst(x, y, theme.accent, 10)
    this.ripple(x, y, theme.accent, 78)
    this.shake(3, 0.12)
  }

  explode(obstacle) {
    const { x, y } = obstacle.root
    this.remove(obstacle)
    this.burst(x, y, theme.danger, 18)
    this.ripple(x, y, theme.danger, 145)
    this.shake(15, 0.38)
  }

  ripple(x, y, color, radius) {
    const graphics = this.effectLayer.addChild(new PIXI.Graphics())
    this.effects.push({ type: 'ripple', graphics, x, y, color, radius, life: 0, duration: 0.34 })
  }

  burst(x, y, color, count) {
    for (let index = 0; index < count; index++) {
      const graphics = this.effectLayer.addChild(new PIXI.Graphics())
      graphics.beginFill(color)
      graphics.drawCircle(0, 0, 4 + Math.random() * 4)
      graphics.endFill()
      const angle = Math.PI * 2 * index / count + Math.random() * 0.3
      const speed = 110 + Math.random() * 170
      graphics.position.set(x, y)
      this.effects.push({
        type: 'particle', graphics, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0, duration: 0.42 + Math.random() * 0.18,
      })
    }
  }

  shake(power, duration) {
    this.shakePower = power
    this.shakeTime = duration
  }

  update(delta, direction = 1) {
    const seconds = delta / 60
    this.turnTime = Math.max(0, this.turnTime - seconds)
    this.flowDistance = (this.flowDistance + seconds * 145 * direction + this.track.total) % this.track.total
    this.trackFlow.clear()
    for (let offset = 0; offset < this.track.total; offset += 82) {
      const point = this.track.pointAt((this.flowDistance + offset) % this.track.total)
      this.trackFlow.beginFill(theme.primary, 0.36)
      this.trackFlow.drawCircle(point.x, point.y, 4)
      this.trackFlow.endFill()
    }

    this.effects = this.effects.filter((effect) => {
      effect.life += seconds
      const progress = Math.min(1, effect.life / effect.duration)
      if (effect.type === 'ripple') {
        effect.graphics.clear()
        effect.graphics.lineStyle(6 * (1 - progress), effect.color, 0.8 * (1 - progress))
        effect.graphics.drawCircle(effect.x, effect.y, 10 + effect.radius * progress)
      } else {
        effect.graphics.x += effect.vx * seconds
        effect.graphics.y += effect.vy * seconds
        effect.graphics.alpha = 1 - progress
        effect.graphics.scale.set(1 - progress * 0.5)
      }
      if (progress < 1) return true
      effect.graphics.destroy()
      return false
    })

    if (this.shakeTime > 0) {
      this.shakeTime -= seconds
      const strength = this.shakePower * Math.max(0, this.shakeTime / 0.38)
      this.position.set(this.baseX + (Math.random() - 0.5) * strength, this.baseY + (Math.random() - 0.5) * strength)
    } else if (this.baseX !== undefined) {
      this.position.set(this.baseX, this.baseY)
    }
  }

  destroy(options) {
    this.dialog = null
    this.obstacles.length = 0
    this.effects.length = 0
    super.destroy(options)
  }
}
