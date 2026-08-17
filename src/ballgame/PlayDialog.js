import * as PIXI from 'pixi.js'
import Dialog from './Dialog.js'
import BallGameBackdrop from './BallGameBackdrop.js'
import { levels } from './BallGameData.js'
import PlayGameView from './PlayGameView.js'
import PlayHudView from './PlayHudView.js'
import PlayRuleMgr from './PlayRuleMgr.js'
import ResultDialog from './ResultDialog.js'

export default class PlayDialog extends Dialog {
  onCreate(levelIndex = 0) {
    this.levelIndex = levelIndex
    this.level = levels[levelIndex]
    this.eventMode = 'static'
    this.backdrop = this.addChild(new BallGameBackdrop(this.app.textures.star, 20))
    this.gameView = this.addChild(new PlayGameView(this))
    this.flashLayer = this.addChild(new PIXI.Graphics())
    this.flashLayer.alpha = 0
    this.hudView = this.addChild(new PlayHudView(this, this.level, levelIndex))
    this.ruleMgr = this.use(new PlayRuleMgr(this.level))
    this.pixi(this, 'pointerdown', () => this.ruleMgr.reverse())
  }

  onUpdate(delta) {
    this.ruleMgr.update(delta)
    this.gameView.update(delta, this.ruleMgr.direction)
    this.hudView.update(delta)
    this.backdrop.update(delta)
    this.flashLayer.alpha = Math.max(0, this.flashLayer.alpha - delta * 0.055)
  }

  onResize(screen) {
    this.hitArea = new PIXI.Rectangle(0, 0, screen.width, screen.height)
    this.flashLayer.clear()
    this.flashLayer.beginFill(0xffffff)
    this.flashLayer.drawRect(0, 0, screen.width, screen.height)
    this.flashLayer.endFill()
    this.backdrop.layout(screen)
    this.hudView.layout(screen)
    this.gameView.layout({ x: 12, y: 94, width: screen.width - 24, height: screen.height - 106 })
  }

  flash(color, alpha) {
    this.flashColor = color
    this.flashLayer.tint = color
    this.flashLayer.alpha = alpha
  }

  finish(won, score) {
    this.timeout(() => {
      this.app.dialogMgr.replace(ResultDialog, { won, score, levelIndex: this.levelIndex })
    }, won ? 480 : 560)
  }
}
