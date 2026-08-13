import * as PIXI from 'pixi.js'
import { Dialog } from '../game-guide/index.js'
import BallGameBackdrop from './BallGameBackdrop.js'
import BallGameButton from './BallGameButton.js'
import { levels } from './BallGameData.js'
import PlayDialog from './PlayDialog.js'
import { theme } from './theme.js'

export default class ResultDialog extends Dialog {
  onCreate(result) {
    this.backdrop = this.addChild(new BallGameBackdrop(this.app.textures.star))
    this.content = this.addChild(new PIXI.Container())
    const lastLevel = result.levelIndex === levels.length - 1

    const art = new PIXI.Sprite(this.app.textures[result.won ? 'playerWin' : 'playerFail'])
    art.anchor.set(0.5)
    art.scale.set(result.won ? 0.72 : 0.78)
    art.position.set(0, -105)
    this.content.addChild(art)

    const title = new PIXI.Text(
      result.won ? (lastLevel ? '全部通关' : '好运到手') : '差点走运',
      {
        fontFamily: theme.fontFamily,
        fontSize: 48,
        fontWeight: 'bold',
        fill: result.won ? theme.accent : theme.danger,
      },
    )
    title.anchor.set(0.5)
    title.position.set(0, 130)
    this.content.addChild(title)

    const progress = new PIXI.Text(
      result.won ? `${result.levelIndex + 1}/${levels.length} 关` : `运气 ${result.score}/${levels[result.levelIndex].target}`,
      {
        fontFamily: theme.fontFamily,
        fontSize: 22,
        fill: theme.muted,
      },
    )
    progress.anchor.set(0.5)
    progress.position.set(0, 184)
    this.content.addChild(progress)

    const nextLevel = result.won ? (result.levelIndex + 1) % levels.length : result.levelIndex
    const button = new BallGameButton(
      result.won ? (lastLevel ? '再来一轮' : '下一关') : '重试本关',
      () => {
        this.app.audioMgr.play('click')
        this.app.dialogMgr.replace(PlayDialog, nextLevel)
      },
      result.won ? theme.accent : theme.primary,
    )
    button.position.set(0, 270)
    this.content.addChild(button)
  }

  onResize(screen) {
    this.backdrop.layout(screen)
    this.content.position.set(screen.width / 2, screen.height / 2)
    this.content.scale.set(Math.min(1, screen.width / 680, screen.height / 760))
  }
}
