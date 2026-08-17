import * as PIXI from 'pixi.js'
import Dialog from './Dialog.js'
import BallGameBackdrop from './BallGameBackdrop.js'
import BallGameButton from './BallGameButton.js'
import { levels } from './BallGameData.js'
import PlayDialog from './PlayDialog.js'
import { theme } from './theme.js'

export default class ResultDialog extends Dialog {
  onCreate(result) {
    this.time = 0
    this.result = result
    this.backdrop = this.addChild(new BallGameBackdrop(this.app.textures.star))
    this.content = this.addChild(new PIXI.Container())
    this.content.alpha = 0
    const lastLevel = result.levelIndex === levels.length - 1
    const resultColor = result.won ? theme.accent : theme.danger

    const shadow = new PIXI.Graphics()
    shadow.beginFill(0x000000, 0.34)
    shadow.drawRoundedRect(-250, -329, 500, 678, 10)
    shadow.endFill()
    shadow.position.y = 13
    this.content.addChild(shadow)

    const panel = new PIXI.Graphics()
    panel.lineStyle(2, theme.border, 0.8)
    panel.beginFill(theme.surface, 0.98)
    panel.drawRoundedRect(-250, -342, 500, 678, 10)
    panel.endFill()
    panel.beginFill(resultColor, 0.85)
    panel.drawRoundedRect(-230, -322, 460, 4, 2)
    panel.endFill()
    this.content.addChild(panel)

    const eyebrow = new PIXI.Text(result.won ? 'LUCK SECURED' : 'RUN INTERRUPTED', {
      fontFamily: theme.fontFamily,
      fontSize: 12,
      fontWeight: 'bold',
      fill: resultColor,
      letterSpacing: 2,
    })
    eyebrow.anchor.set(0.5)
    eyebrow.position.set(0, -291)
    this.content.addChild(eyebrow)

    const artFrame = new PIXI.Graphics()
    artFrame.lineStyle(2, resultColor, 0.48)
    artFrame.beginFill(theme.surfaceRaised, 0.86)
    artFrame.drawRoundedRect(-170, -250, 340, 310, 8)
    artFrame.endFill()
    this.content.addChild(artFrame)

    this.art = new PIXI.Sprite(this.app.textures[result.won ? 'playerWin' : 'playerFail'])
    this.art.anchor.set(0.5)
    this.art.scale.set(result.won ? 0.5 : 0.54)
    this.art.position.set(0, -93)
    const artMask = new PIXI.Graphics()
    artMask.beginFill(0xffffff)
    artMask.drawRoundedRect(-164, -244, 328, 298, 6)
    artMask.endFill()
    this.content.addChild(artMask)
    this.art.mask = artMask
    this.content.addChild(this.art)

    const title = new PIXI.Text(
      result.won ? (lastLevel ? '全部通关' : '好运到手') : '差点走运',
      {
        fontFamily: theme.fontFamily,
        fontSize: 43,
        fontWeight: 'bold',
        fill: resultColor,
      },
    )
    title.anchor.set(0.5)
    title.position.set(0, 111)
    this.content.addChild(title)

    const progressLabel = new PIXI.Text(result.won ? '关卡进度' : '本次好运', {
      fontFamily: theme.fontFamily,
      fontSize: 11,
      fontWeight: 'bold',
      fill: theme.muted,
      letterSpacing: 1,
    })
    progressLabel.anchor.set(0.5)
    progressLabel.position.set(0, 164)
    this.content.addChild(progressLabel)

    const progress = new PIXI.Text(
      result.won ? `${result.levelIndex + 1} / ${levels.length}` : `${result.score} / ${levels[result.levelIndex].target}`,
      {
        fontFamily: theme.fontFamily,
        fontSize: 27,
        fontWeight: 'bold',
        fill: theme.text,
      },
    )
    progress.anchor.set(0.5)
    progress.position.set(0, 199)
    this.content.addChild(progress)

    const nextLevel = result.won ? (result.levelIndex + 1) % levels.length : result.levelIndex
    this.button = new BallGameButton(
      result.won ? (lastLevel ? '再来一轮' : '下一关') : '重试本关',
      () => {
        this.button.setEnabled(false)
        this.app.audioMgr.play('click')
        this.timeout(() => this.app.dialogMgr.replace(PlayDialog, nextLevel), 120)
      },
      result.won ? theme.accent : theme.primary,
    )
    this.button.position.set(0, 280)
    this.button.setEnabled(false)
    this.content.addChild(this.button)
    this.timeout(() => this.button.setEnabled(true), 320)
  }

  onUpdate(delta) {
    this.time += delta / 60
    this.backdrop.update(delta)
    this.content.alpha = Math.min(1, this.content.alpha + delta * 0.07)
    const entrance = Math.min(1, this.time / 0.38)
    this.content.scale.set(this.layoutScale * (0.9 + 0.1 * (1 - (1 - entrance) ** 3)))
    this.art.y = -93 + Math.sin(this.time * 2.2) * (this.result.won ? 4 : 2)
  }

  onResize(screen) {
    this.backdrop.layout(screen)
    this.content.position.set(screen.width / 2, screen.height / 2)
    this.layoutScale = Math.min(1, screen.width / 570, screen.height / 740)
    this.content.scale.set(this.layoutScale)
  }
}
