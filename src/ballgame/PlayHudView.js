import * as PIXI from 'pixi.js'
import { theme } from './theme.js'

const textStyle = {
  fontFamily: theme.fontFamily,
  fontWeight: 'bold',
  fill: theme.text,
}

export default class PlayHudView extends PIXI.Container {
  constructor(dialog, level, levelIndex) {
    super()
    this.level = level
    this.score = 0
    this.pulse = 0
    this.enter = 0
    this.alpha = 0
    this.panel = this.addChild(new PIXI.Graphics())

    this.levelLabel = new PIXI.Text(`第 ${levelIndex + 1} 关`, {
      ...textStyle,
      fontSize: 11,
      fill: theme.primary,
      letterSpacing: 1,
    })
    this.addChild(this.levelLabel)

    this.levelText = new PIXI.Text(level.name, { ...textStyle, fontSize: 20 })
    this.addChild(this.levelText)

    this.luckIcon = new PIXI.Sprite(dialog.app.textures.hankey)
    this.luckIcon.anchor.set(0.5)
    this.luckIcon.scale.set(0.38)
    this.addChild(this.luckIcon)

    this.progressLabel = new PIXI.Text('好运进度', {
      ...textStyle,
      fontSize: 10,
      fill: theme.muted,
      letterSpacing: 1,
    })
    this.addChild(this.progressLabel)

    this.scoreText = new PIXI.Text('', {
      ...textStyle,
      fontSize: 17,
      fill: theme.accent,
    })
    this.scoreText.anchor.set(1, 0)
    this.addChild(this.scoreText)
    this.segments = this.addChild(new PIXI.Graphics())
    this.setScore(0)
  }

  setScore(score) {
    this.score = score
    this.pulse = 1
    this.scoreText.text = `${score} / ${this.level.target}`
    this.drawSegments()
  }

  drawSegments() {
    if (!this.widthValue) return
    const available = Math.min(270, this.widthValue - 272)
    const gap = 4
    const segmentWidth = (available - gap * (this.level.target - 1)) / this.level.target
    this.segments.clear()
    for (let index = 0; index < this.level.target; index++) {
      this.segments.lineStyle(1, index < this.score ? theme.accent : theme.border, 0.85)
      this.segments.beginFill(index < this.score ? theme.accent : theme.surface, index < this.score ? 1 : 0.9)
      this.segments.drawRoundedRect(index * (segmentWidth + gap), 0, segmentWidth, 9, 3)
      this.segments.endFill()
    }
  }

  layout(screen) {
    this.widthValue = Math.min(720, screen.width - 28)
    const x = (screen.width - this.widthValue) / 2
    this.panel.clear()
    this.panel.lineStyle(1, theme.border, 0.65)
    this.panel.beginFill(theme.surface, 0.94)
    this.panel.drawRoundedRect(x, 14, this.widthValue, 72, 8)
    this.panel.endFill()
    this.panel.beginFill(theme.primary, 0.8)
    this.panel.drawRoundedRect(x + 10, 25, 3, 50, 2)
    this.panel.endFill()

    this.levelLabel.position.set(x + 24, 25)
    this.levelText.position.set(x + 24, 43)
    this.luckIcon.position.set(x + 205, 50)
    this.progressLabel.position.set(x + 233, 25)
    this.scoreText.position.set(x + this.widthValue - 18, 22)
    this.segments.position.set(x + 233, 59)
    this.drawSegments()
  }

  update(delta) {
    this.enter = Math.min(1, this.enter + delta * 0.06)
    this.alpha = this.enter
    this.y = -10 * (1 - this.enter)
    this.pulse = Math.max(0, this.pulse - delta * 0.08)
    const scale = 1 + Math.sin(this.pulse * Math.PI) * 0.24
    this.luckIcon.scale.set(0.38 * scale)
    this.scoreText.scale.set(scale)
  }
}
