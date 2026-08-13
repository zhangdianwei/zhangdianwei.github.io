import * as PIXI from 'pixi.js'
import { Dialog } from '../game-guide/index.js'
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
    this.hudView = this.addChild(new PlayHudView(this.level, levelIndex))
    this.ruleMgr = this.use(new PlayRuleMgr(this.level))
    this.pixi(this, 'pointertap', () => this.ruleMgr.reverse())
  }

  onUpdate(delta) {
    this.ruleMgr.update(delta)
  }

  onResize(screen) {
    this.hitArea = new PIXI.Rectangle(0, 0, screen.width, screen.height)
    this.backdrop.layout(screen)
    this.hudView.layout(screen)
    this.gameView.layout({ x: 12, y: 82, width: screen.width - 24, height: screen.height - 100 })
  }

  finish(won, score) {
    this.timeout(() => {
      this.app.dialogMgr.replace(ResultDialog, { won, score, levelIndex: this.levelIndex })
    }, 260)
  }
}
