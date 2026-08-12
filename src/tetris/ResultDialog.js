import * as PIXI from 'pixi.js'
import * as TWEEN from '@tweenjs/tween.js'
import { Dialog } from '../game-guide/index.js'
import TetrisButton from './TetrisButton.js'
import StartDialog from './StartDialog.js'
import { theme } from './theme.js'

export default class ResultDialog extends Dialog {
    onCreate(result) {
        this.eventMode = 'static'
        this.result = result

        this.createMask()
        this.createPanel(result)
    }

    onResize(screen) {
        this.position.set(screen.width / 2, screen.height / 2)
        this.resizeMask(screen)
    }

    createMask() {
        this.maskGraphic = new PIXI.Graphics()
        this.maskGraphic.alpha = 0
        this.addChild(this.maskGraphic)
        this.resizeMask(this.app.pixi.screen)

        new TWEEN.Tween(this.maskGraphic)
            .to({ alpha: 1 }, 220)
            .start()
    }

    resizeMask(screen) {
        this.maskGraphic.clear()
        this.maskGraphic.beginFill(0x000000, 0.55)
        this.maskGraphic.drawRect(-screen.width, -screen.height, screen.width * 2, screen.height * 2)
        this.maskGraphic.endFill()
    }

    createPanel(result) {
        this.panelContainer = new PIXI.Container()
        this.panelContainer.alpha = 0
        this.panelContainer.scale.set(0.95)
        this.addChild(this.panelContainer)

        const panel = new PIXI.Graphics()
        panel.beginFill(0x111111, 0.85)
        panel.drawRoundedRect(-155, -165, 310, 330, 14)
        panel.endFill()
        this.panelContainer.addChild(panel)

        const titleStyle = new PIXI.TextStyle({
            fontFamily: theme.fontFamily,
            fontSize: 34,
            fill: 0xFFD166,
            fontWeight: 'bold',
            align: 'center'
        })
        const textStyle = new PIXI.TextStyle({
            fontFamily: theme.fontFamily,
            fontSize: 18,
            fill: 0xFFFFFF,
            align: 'left'
        })

        const titleText = new PIXI.Text(result.title, titleStyle)
        titleText.anchor.set(0.5, 0.5)
        titleText.position.set(0, -120)
        this.panelContainer.addChild(titleText)

        const modeText = new PIXI.Text('模式：经典模式', textStyle)
        modeText.anchor.set(0.5, 0.5)
        modeText.position.set(0, -70)
        this.panelContainer.addChild(modeText)

        const reasonText = new PIXI.Text(`结束原因：${result.reason}`, textStyle)
        reasonText.anchor.set(0.5, 0.5)
        reasonText.position.set(0, -40)
        this.panelContainer.addChild(reasonText)

        const scoreText = new PIXI.Text(`得分：${result.score}`, textStyle)
        scoreText.anchor.set(0.5, 0.5)
        scoreText.position.set(0, 0)
        this.panelContainer.addChild(scoreText)

        const linesText = new PIXI.Text(`消行：${result.lines}`, textStyle)
        linesText.anchor.set(0.5, 0.5)
        linesText.position.set(0, 30)
        this.panelContainer.addChild(linesText)

        const levelText = new PIXI.Text(`等级：${result.level}`, textStyle)
        levelText.anchor.set(0.5, 0.5)
        levelText.position.set(0, 60)
        this.panelContainer.addChild(levelText)

        const timeText = new PIXI.Text(`耗时：${this.formatDuration(result.elapsed)}`, textStyle)
        timeText.anchor.set(0.5, 0.5)
        timeText.position.set(0, 90)
        this.panelContainer.addChild(timeText)

        const backButton = new TetrisButton(this.app, '返回主页', () => {
            this.app.dialogMgr.replace(StartDialog)
        })
        backButton.position.set(0, 130)
        this.panelContainer.addChild(backButton)
        backButton.setEnabled(false)

        new TWEEN.Tween(this.panelContainer)
            .to({ alpha: 1 }, 260)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => backButton.setEnabled(true))
            .start()
        new TWEEN.Tween(this.panelContainer.scale)
            .to({ x: 1, y: 1 }, 260)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start()
    }

    formatDuration(ms) {
        const totalSec = Math.max(0, Math.floor(ms / 1000))
        const minute = Math.floor(totalSec / 60)
        const second = totalSec % 60
        return `${minute}:${second.toString().padStart(2, '0')}`
    }
}
