import * as PIXI from 'pixi.js'
import { Dialog } from '../game-guide/index.js'
import TetrisPlayer from './data/TetrisPlayer.js'
import PlayGameView from './PlayGameView.js'
import PlayHudView from './PlayHudView.js'
import PlayRuleMgr from './PlayRuleMgr.js'
import PlayInputMgr from './PlayInputMgr.js'
import ResultDialog from './ResultDialog.js'
import { GameStartMode } from './data/TetrisEvents.js'

export default class PlayDialog extends Dialog {
    onCreate(mode) {
        this.mode = mode || GameStartMode.Marathon
        this.player = new TetrisPlayer({
            userId: TetrisPlayer.generateUserId('Player'),
            isMaster: true,
        })

        this.contentRoot = this.addChild(new PIXI.Container())

        this.gameView = this.contentRoot.addChild(new PlayGameView(this))
        this.gameView.init()

        this.ruleMgr = this.use(new PlayRuleMgr())

        this.hudView = this.contentRoot.addChild(new PlayHudView(this))
        this.hudView.init()

        this.inputMgr = this.use(new PlayInputMgr())

        // 棋盘 + HUD 焊死成一块整体后，让合并包围盒的中心对齐到 (0,0)，
        // 这样 PlayDialog 居中到屏幕中心时，视觉上才是整体居中，而不是偏向棋盘一侧。
        const bounds = this.contentRoot.getLocalBounds()
        this.contentRoot.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    }

    onUpdate(delta) {
        this.ruleMgr.update(delta)
    }

    onResize(screen) {
        this.position.set(screen.width / 2, screen.height / 2)
        this.hitArea = new PIXI.Rectangle(-screen.width / 2, -screen.height / 2, screen.width, screen.height)
    }

    finish(result) {
        this.app.dialogMgr.replace(ResultDialog, result)
    }
}
