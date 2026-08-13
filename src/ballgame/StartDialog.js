import * as PIXI from 'pixi.js'
import { Dialog } from '../game-guide/index.js'
import BallGameBackdrop from './BallGameBackdrop.js'
import BallGameButton from './BallGameButton.js'
import PlayDialog from './PlayDialog.js'
import { levels } from './BallGameData.js'
import { theme } from './theme.js'

export default class StartDialog extends Dialog {
  onCreate() {
    this.backdrop = this.addChild(new BallGameBackdrop(this.app.textures.star))
    this.content = this.addChild(new PIXI.Container())

    const title = new PIXI.Text('抓住狗屎运', {
      fontFamily: theme.fontFamily,
      fontSize: 64,
      fontWeight: 'bold',
      fill: theme.text,
      align: 'center',
    })
    title.anchor.set(0.5)
    title.position.set(0, -250)
    this.content.addChild(title)

    const subtitle = new PIXI.Text(`${levels.length} 关挑战`, {
      fontFamily: theme.fontFamily,
      fontSize: 24,
      fill: theme.muted,
    })
    subtitle.anchor.set(0.5)
    subtitle.position.set(0, -180)
    this.content.addChild(subtitle)

    const player = new PIXI.Sprite(this.app.textures.playerRun)
    player.anchor.set(0.5)
    player.scale.set(2.15)
    player.position.set(0, -10)
    this.content.addChild(player)

    const luck = new PIXI.Sprite(this.app.textures.hankey)
    luck.anchor.set(0.5)
    luck.position.set(-130, 120)
    this.content.addChild(luck)

    const bomb = new PIXI.Sprite(this.app.textures.bomb)
    bomb.anchor.set(0.5)
    bomb.position.set(130, 120)
    this.content.addChild(bomb)

    const button = new BallGameButton('开始挑战', () => {
      this.app.audioMgr.play('click')
      this.app.dialogMgr.replace(PlayDialog, 0)
    })
    button.position.set(0, 260)
    this.content.addChild(button)
  }

  onResize(screen) {
    this.backdrop.layout(screen)
    this.content.position.set(screen.width / 2, screen.height / 2)
    this.content.scale.set(Math.min(1, screen.width / 680, screen.height / 760))
  }
}
