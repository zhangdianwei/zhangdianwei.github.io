import * as PIXI from 'pixi.js'
import { Dialog } from '../game-guide/index.js'
import PlayGameView from './PlayGameView.js'
import PlayHudView, { HudWidth } from './PlayHudView.js'
import PlayRuleMgr from './PlayRuleMgr.js'
import PlayEnemySpawner from './PlayEnemySpawner.js'
import PlayInputMgr from './PlayInputMgr.js'
import { MapWidth, MapHeight } from './TileType.js'

const CoreWidth = MapWidth + HudWidth
const Margin = 24
const TouchReserve = 570

export default class PlayDialog extends Dialog {
    onCreate() {
        this.contentRoot = this.addChild(new PIXI.Container())
        this.gameView = this.contentRoot.addChild(new PlayGameView(this))
        this.gameView.init()
        this.gameView.position.set(MapWidth / 2, MapHeight / 2)
        this.hudView = this.contentRoot.addChild(new PlayHudView(this))
        this.hudView.init()
        this.hudView.position.set(MapWidth, 0)

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
        const touch = Boolean(this.inputMgr.gamepad)
        const scale = Math.min(
            1,
            Math.max(0.25, (screen.width - (touch ? TouchReserve : Margin * 2)) / CoreWidth),
            Math.max(0.25, (screen.height - Margin * 2) / MapHeight),
        )
        this.contentRoot.scale.set(scale)
        this.contentRoot.position.set(
            (screen.width - CoreWidth * scale) / 2,
            (screen.height - MapHeight * scale) / 2,
        )
        this.inputMgr.layout(screen, touch ? {
            joystick: { x: Margin + this.inputMgr.gamepad.baseRadius, y: screen.height / 2 },
            joystickArea: { x: 0, y: 0, width: screen.width / 2, height: screen.height },
            buttons: {
                A: { x: screen.width - Margin - this.inputMgr.gamepad.buttonRadius, y: screen.height / 2 },
            },
            buttonAreas: {
                A: { x: screen.width / 2, y: 0, width: screen.width / 2, height: screen.height },
            },
        } : undefined)
    }
}
