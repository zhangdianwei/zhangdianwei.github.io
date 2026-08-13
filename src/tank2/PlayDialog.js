import { Dialog } from '../game-guide/index.js'
import PlayGameView from './PlayGameView.js'
import PlayHudView from './PlayHudView.js'
import PlayRuleMgr from './PlayRuleMgr.js'
import PlayEnemySpawner from './PlayEnemySpawner.js'
import PlayInputMgr from './PlayInputMgr.js'

const HudSidebarWidth = 340 // 横屏：地图右侧竖版信息面板预留宽度
const HudBarHeight = 90     // 竖屏：地图上方横向信息条高度
const ControlsHeight = 200  // 有触屏手柄时，底部预留高度

export default class PlayDialog extends Dialog {
    onCreate() {
        this.gameView = this.addChild(new PlayGameView(this))
        this.gameView.init()

        this.hudView = this.addChild(new PlayHudView(this))
        this.hudView.init()

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
        const portrait = screen.height > screen.width
        const controlsHeight = this.inputMgr.gamepad ? ControlsHeight : 0

        const viewport = portrait
            ? { x: 0, y: HudBarHeight, width: screen.width, height: screen.height - HudBarHeight - controlsHeight }
            : { x: 0, y: 0, width: screen.width - HudSidebarWidth, height: screen.height - controlsHeight }

        this.gameView.layout(viewport)
        this.hudView.layout(screen, viewport, portrait)
        this.inputMgr.layout(screen)
    }
}
