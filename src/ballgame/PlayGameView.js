import * as PIXI from 'pixi.js'
import { pathPosition, WORLD } from './BallGameData.js'
import { theme } from './theme.js'

export default class PlayGameView extends PIXI.Container {
  constructor(dialog) {
    super()
    this.dialog = dialog
    this.obstacles = []
    this.path = this.addChild(new PIXI.Graphics())
    this.items = this.addChild(new PIXI.Container())
  }

  setup(level) {
    this.level = level
    this.path.clear()
    this.path.lineStyle(46, theme.track, 0.38)
    for (let i = 0; i <= 140; i++) {
      const point = pathPosition(level.path, i / 140)
      if (i) this.path.lineTo(point.x, point.y)
      else this.path.moveTo(point.x, point.y)
    }

    this.player = new PIXI.Sprite(this.dialog.app.textures.playerRun)
    this.player.anchor.set(0.5)
    this.player.position.copyFrom(pathPosition(level.path, 0))
    this.items.addChild(this.player)
  }

  layout(viewport) {
    const scale = Math.min(viewport.width / WORLD.width, viewport.height / WORLD.height)
    this.scale.set(scale)
    this.position.set(
      viewport.x + (viewport.width - WORLD.width * scale) / 2,
      viewport.y + (viewport.height - WORLD.height * scale) / 2,
    )
  }

  movePlayer(position, direction) {
    this.player.position.copyFrom(pathPosition(this.level.path, position))
    this.player.scale.x = direction
  }

  spawn(type) {
    const sprite = new PIXI.Sprite(this.dialog.app.textures[type])
    sprite.anchor.set(0.5)
    sprite.position.set(90 + Math.random() * 720, -60)
    this.items.addChild(sprite)
    const obstacle = { type, sprite }
    this.obstacles.push(obstacle)
    return obstacle
  }

  remove(obstacle) {
    const index = this.obstacles.indexOf(obstacle)
    if (index !== -1) this.obstacles.splice(index, 1)
    obstacle.sprite.destroy()
  }

  destroy(options) {
    this.dialog = null
    this.obstacles.length = 0
    super.destroy(options)
  }
}
