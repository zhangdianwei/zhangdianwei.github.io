import * as PIXI from 'pixi.js'
import Dialog from './Dialog.js'
import PlayGameView from './PlayGameView.js'
import PlayHudView, { HudScale, HudWidth } from './PlayHudView.js'
import PlayRuleMgr from './PlayRuleMgr.js'
import PlayEnemySpawner from './PlayEnemySpawner.js'
import PlayInputMgr from './PlayInputMgr.js'
import { MapWidth, MapHeight } from './TileType.js'

const CoreWidth = MapWidth + HudWidth

export default class PlayDialog extends Dialog {
    onCreate() {
        this.contentRoot = this.addChild(new PIXI.Container())
        this.gameView = this.contentRoot.addChild(new PlayGameView(this))
        this.gameView.init()
        this.gameView.position.set(MapWidth / 2, MapHeight / 2)
        this.hudView = this.contentRoot.addChild(new PlayHudView(this))
        this.hudView.init()
        this.hudView.scale.set(HudScale)
        this.hudView.position.set(MapWidth, 0)

        this.pauseOverlay = this.addChild(new PIXI.Container())
        const shade = this.pauseOverlay.addChild(new PIXI.Graphics())
        shade.beginFill(0x101817, 0.84)
        shade.drawRoundedRect(-130, -55, 260, 110, 8)
        shade.endFill()
        const pauseText = this.pauseOverlay.addChild(new PIXI.Text('暂停', {
            fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
            fontSize: 42,
            fontWeight: 'bold',
            fill: 0xF6F1E5,
        }))
        pauseText.anchor.set(0.5)
        this.pauseOverlay.visible = false
        this.paused = false

        this.ruleMgr = this.use(new PlayRuleMgr())
        this.enemySpawner = this.use(new PlayEnemySpawner())
        this.inputMgr = this.use(new PlayInputMgr())
        this.gameView.startLevel(this.app.data.levelId)
        this.gameView.createPlayer()
        this.hudView.updateView()
        this.app.audioMgr.play('start', { volume: 0.9 })
    }

    onUpdate() {
        if (!this.paused) this.ruleMgr.update()
    }

    onResize(screen) {
        const scale = Math.min(
            screen.width / CoreWidth,
            screen.height / MapHeight,
        )
        this.contentRoot.scale.set(scale)
        this.contentRoot.position.set(
            (screen.width - CoreWidth * scale) / 2,
            (screen.height - MapHeight * scale) / 2,
        )
        this.pauseOverlay.position.set(screen.width / 2, screen.height / 2)
    }

    onControl(control, pressed, source = control) {
        if (control === 'start' && pressed) {
            this.togglePaused()
            return
        }
        if (!this.paused) this.inputMgr.setControl(control, pressed, source)
    }

    togglePaused() {
        this.paused = !this.paused
        this.pauseOverlay.visible = this.paused
        if (this.paused) this.inputMgr.releaseAll()
    }

    onDestroy() {
        this.app.audioMgr.stop('move')
        this.app.audioMgr.stop('start')
    }
}
