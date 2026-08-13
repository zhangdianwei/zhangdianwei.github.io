import { WORLD } from './BallGameData.js'

const collides = (a, b) => (
  Math.abs(a.x - b.x) < (a.width + b.width) * 0.45
  && Math.abs(a.y - b.y) < (a.height + b.height) * 0.45
)

export default class PlayRuleMgr {
  constructor(level) {
    this.level = level
  }

  init(dialog) {
    this.dialog = dialog
    this.position = 0
    this.direction = 1
    this.score = 0
    this.spawnElapsed = 0
    this.finished = false
    dialog.gameView.setup(this.level)
  }

  reverse() {
    if (this.finished) return
    this.direction *= -1
    this.dialog.app.audioMgr.play('click')
  }

  update(delta) {
    if (this.finished) return
    const step = Math.min(delta, 2.5)
    this.position += this.level.speed * this.direction * step

    if (this.position >= 1 || this.position <= 0) {
      this.position = Math.max(0, Math.min(1, this.position))
      this.direction *= -1
    }

    this.dialog.gameView.movePlayer(this.position, this.direction)
    this.spawnElapsed += step * 1000 / 60
    if (this.spawnElapsed >= this.level.interval) {
      this.spawnElapsed = 0
      const types = this.level.types
      this.dialog.gameView.spawn(types[Math.floor(Math.random() * types.length)])
    }

    const player = this.dialog.gameView.player
    const playerBox = { x: player.x, y: player.y, width: player.width, height: player.height }
    const obstacles = [...this.dialog.gameView.obstacles]

    for (const obstacle of obstacles) {
      obstacle.sprite.y += 8 * step
      if (obstacle.sprite.y > WORLD.height + 70) {
        this.dialog.gameView.remove(obstacle)
      } else if (collides(playerBox, obstacle.sprite)) {
        this.collect(obstacle)
        if (this.finished) break
      }
    }
  }

  collect(obstacle) {
    this.dialog.gameView.remove(obstacle)

    if (obstacle.type === 'bomb') {
      this.finished = true
      this.dialog.app.audioMgr.play('bomb')
      this.dialog.finish(false, this.score)
      return
    }

    this.score++
    this.dialog.hudView.setScore(this.score)
    this.dialog.app.audioMgr.play('collect')
    if (this.score >= this.level.target) {
      this.finished = true
      this.dialog.finish(true, this.score)
    }
  }

  destroy() {
    this.dialog = null
  }
}
