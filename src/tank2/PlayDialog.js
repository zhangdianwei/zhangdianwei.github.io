import * as PIXI from 'pixi.js'
import { Dialog } from '../game-guide/index.js'
import PlayGameView from './PlayGameView.js'
import PlayHudView from './PlayHudView.js'
import PlayRuleMgr from './PlayRuleMgr.js'
import PlayEnemySpawner from './PlayEnemySpawner.js'
import PlayInputMgr from './PlayInputMgr.js'
import { MapWidth } from './TileType.js'

const HudGap = 40

export default class PlayDialog extends Dialog {
    onCreate() {
        this.contentRoot = this.addChild(new PIXI.Container())

        this.gameView = this.contentRoot.addChild(new PlayGameView(this))
        this.gameView.init()

        this.hudView = this.contentRoot.addChild(new PlayHudView(this))
        this.hudView.init()
        this.hudView.position.set(MapWidth / 2 + HudGap, 0)

        const bounds = this.contentRoot.getLocalBounds()
        this.contentRoot.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
        this.contentWidth = bounds.width
        this.contentHeight = bounds.height

        this.ruleMgr = this.use(new PlayRuleMgr())
        this.enemySpawner = this.use(new PlayEnemySpawner())
        this.inputMgr = this.use(new PlayInputMgr())

        this.gameView.startLevel(this.app.data.levelId)
        this.gameView.createPlayer()
        this.hudView.updateView()
    }

    onUpdate() {
        this.ruleMgr.update()
    }

    onResize(screen) {
        this.position.set(screen.width / 2, screen.height / 2)
        if (this.contentWidth && this.contentHeight) {
            const scale = Math.min(screen.width / this.contentWidth, screen.height / this.contentHeight)
            this.contentRoot.scale.set(scale)
        }
    }
}
