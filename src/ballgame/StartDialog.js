import * as PIXI from 'pixi.js'
import Dialog from './Dialog.js'
import BallGameBackdrop from './BallGameBackdrop.js'
import BallGameButton from './BallGameButton.js'
import PlayDialog from './PlayDialog.js'
import { levels } from './BallGameData.js'
import { theme } from './theme.js'

export default class StartDialog extends Dialog {
  onCreate() {
    this.time = 0
    this.backdrop = this.addChild(new BallGameBackdrop(this.app.textures.star))
    this.content = this.addChild(new PIXI.Container())
    this.content.alpha = 0
    this.content.scale.set(0.94)

    const shadow = new PIXI.Graphics()
    shadow.beginFill(0x000000, 0.32)
    shadow.drawRoundedRect(-258, -324, 516, 672, 10)
    shadow.endFill()
    shadow.position.set(0, 12)
    this.content.addChild(shadow)

    const panel = new PIXI.Graphics()
    panel.lineStyle(2, theme.border, 0.75)
    panel.beginFill(theme.surface, 0.97)
    panel.drawRoundedRect(-258, -336, 516, 672, 10)
    panel.endFill()
    panel.beginFill(theme.primary, 0.85)
    panel.drawRoundedRect(-238, -316, 4, 84, 2)
    panel.endFill()
    this.content.addChild(panel)

    const eyebrow = new PIXI.Text('LUCK RUN  /  01', {
      fontFamily: theme.fontFamily,
      fontSize: 12,
      fontWeight: 'bold',
      fill: theme.primary,
      letterSpacing: 2,
    })
    eyebrow.anchor.set(0.5)
    eyebrow.position.set(0, -295)
    this.content.addChild(eyebrow)

    const titleShadow = new PIXI.Text('抓住狗屎运', {
      fontFamily: theme.fontFamily,
      fontSize: 53,
      fontWeight: 'bold',
      fill: 0x000000,
    })
    titleShadow.anchor.set(0.5)
    titleShadow.position.set(4, -231)
    titleShadow.alpha = 0.45
    this.content.addChild(titleShadow)

    const title = new PIXI.Text('抓住狗屎运', {
      fontFamily: theme.fontFamily,
      fontSize: 53,
      fontWeight: 'bold',
      fill: theme.text,
    })
    title.anchor.set(0.5)
    title.position.set(0, -237)
    this.content.addChild(title)

    const subtitle = new PIXI.Text(`${levels.length} 条轨道 · 一键转向`, {
      fontFamily: theme.fontFamily,
      fontSize: 17,
      fill: theme.muted,
    })
    subtitle.anchor.set(0.5)
    subtitle.position.set(0, -183)
    this.content.addChild(subtitle)

    this.stage = new PIXI.Graphics()
    this.stage.lineStyle(3, theme.border, 0.7)
    this.stage.beginFill(theme.surfaceRaised, 0.82)
    this.stage.drawEllipse(0, 0, 188, 62)
    this.stage.endFill()
    this.stage.position.set(0, 64)
    this.content.addChild(this.stage)

    this.player = new PIXI.Sprite(this.app.textures.playerRun)
    this.player.anchor.set(0.5)
    this.player.scale.set(2.05)
    this.player.position.set(0, -22)
    this.content.addChild(this.player)

    this.luck = new PIXI.Sprite(this.app.textures.hankey)
    this.luck.anchor.set(0.5)
    this.luck.position.set(-142, 107)
    this.content.addChild(this.luck)

    this.bomb = new PIXI.Sprite(this.app.textures.bomb)
    this.bomb.anchor.set(0.5)
    this.bomb.position.set(142, 107)
    this.content.addChild(this.bomb)

    const luckLabel = new PIXI.Text('接住好运', {
      fontFamily: theme.fontFamily,
      fontSize: 12,
      fontWeight: 'bold',
      fill: theme.accent,
    })
    luckLabel.anchor.set(0.5)
    luckLabel.position.set(-142, 166)
    this.content.addChild(luckLabel)

    const bombLabel = new PIXI.Text('避开炸弹', {
      fontFamily: theme.fontFamily,
      fontSize: 12,
      fontWeight: 'bold',
      fill: theme.danger,
    })
    bombLabel.anchor.set(0.5)
    bombLabel.position.set(142, 166)
    this.content.addChild(bombLabel)

    this.button = new BallGameButton('开始挑战', () => {
      this.button.setEnabled(false)
      this.app.audioMgr.play('click')
      this.timeout(() => this.app.dialogMgr.replace(PlayDialog, 0), 120)
    })
    this.button.position.set(0, 258)
    this.content.addChild(this.button)
  }

  onUpdate(delta) {
    this.time += delta / 60
    this.backdrop.update(delta)
    this.content.alpha = Math.min(1, this.content.alpha + delta * 0.08)
    const entrance = Math.min(1, this.time / 0.32)
    this.content.scale.set(this.layoutScale * (0.94 + 0.06 * (1 - (1 - entrance) ** 3)))
    this.player.y = -22 + Math.sin(this.time * 2.5) * 5
    this.player.rotation = Math.sin(this.time * 1.6) * 0.025
    this.luck.rotation = Math.sin(this.time * 2.3) * 0.08
    this.bomb.rotation = -Math.sin(this.time * 2.8) * 0.07
    this.stage.alpha = 0.72 + Math.sin(this.time * 2) * 0.08
  }

  onResize(screen) {
    this.backdrop.layout(screen)
    this.content.position.set(screen.width / 2, screen.height / 2)
    this.layoutScale = Math.min(1, screen.width / 580, screen.height / 740)
    this.content.scale.set(this.layoutScale)
  }
}
