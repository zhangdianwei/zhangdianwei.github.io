import * as PIXI from 'pixi.js'
import { theme } from './theme.js'

const textStyle = {
  fontFamily: theme.fontFamily,
  fontWeight: 'bold',
  fill: theme.text,
}

export default class PlayHudView extends PIXI.Container {
  constructor(level, levelIndex) {
    super()
    this.level = level

    this.levelText = new PIXI.Text(`${levelIndex + 1}. ${level.name}`, {
      ...textStyle,
      fontSize: 23,
    })
    this.addChild(this.levelText)

    this.scoreText = new PIXI.Text('', {
      ...textStyle,
      fontSize: 23,
      fill: theme.accent,
    })
    this.scoreText.anchor.set(1, 0)
    this.addChild(this.scoreText)
    this.setScore(0)
  }

  setScore(score) {
    this.scoreText.text = `运气 ${score}/${this.level.target}`
  }

  layout(screen) {
    const margin = Math.max(20, Math.min(36, screen.width * 0.04))
    this.levelText.position.set(margin, 28)
    this.scoreText.position.set(screen.width - margin, 28)
  }
}
