import { WORLD } from './BallGameData.js'

const collides = (a, b) => (
  Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius
)

export default class PlayRuleMgr {
  constructor(level) {
    this.level = level
  }

  init(dialog) {
    this.dialog = dialog
    this.distance = 0
    this.direction = 1
    this.score = 0
    this.spawnElapsed = 0
    this.finished = false
    this.track = dialog.gameView.setup(this.level)
  }

  reverse() {
    if (this.finished) return
    this.direction *= -1
    this.dialog.gameView.reverse()
    this.dialog.app.audioMgr.play('click')
  }

  update(delta) {
    if (this.finished) return
    const step = Math.min(delta, 2.5)
    const seconds = step / 60
    this.distance += this.level.speed * this.direction * seconds

    if (this.distance >= this.track.total || this.distance <= 0) {
      this.distance = Math.max(0, Math.min(this.track.total, this.distance))
      this.direction *= -1
      this.dialog.gameView.reverse()
    }

    this.dialog.gameView.movePlayer(this.distance, this.direction, step)
    this.spawnElapsed += seconds * 1000
    if (this.spawnElapsed >= this.level.interval) {
      this.spawnElapsed = 0
      const types = this.level.types
      this.dialog.gameView.spawn(types[Math.floor(Math.random() * types.length)])
    }

    const player = this.dialog.gameView.playerRoot
    const playerBox = { x: player.x, y: player.y, radius: 43 }
    const obstacles = [...this.dialog.gameView.obstacles]

    for (const obstacle of obstacles) {
      this.dialog.gameView.updateObstacle(obstacle, this.level.fallSpeed * seconds, step)
      if (obstacle.root.y > WORLD.height + 70) {
        this.dialog.gameView.remove(obstacle)
      } else if (collides(playerBox, {
        x: obstacle.root.x,
        y: obstacle.root.y,
        radius: obstacle.type === 'bomb' ? 32 : 44,
      })) {
        this.collect(obstacle)
        if (this.finished) break
      }
    }
  }

  collect(obstacle) {
    if (obstacle.type === 'bomb') {
      this.finished = true
      this.dialog.gameView.explode(obstacle)
      this.dialog.flash(0xff5f6d, 0.34)
      this.dialog.app.audioMgr.play('bomb')
      this.dialog.finish(false, this.score)
      return
    }

    this.score++
    this.dialog.gameView.collect(obstacle)
    this.dialog.flash(0xffd447, 0.1)
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
