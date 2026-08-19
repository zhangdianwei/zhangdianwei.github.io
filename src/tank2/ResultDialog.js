import * as PIXI from 'pixi.js'
import Dialog from './Dialog.js'
import StartDialog from './StartDialog.js'
import PlayDialog from './PlayDialog.js'
import { theme } from './theme.js'
import allLevels from './level/levels.json' with { type: 'json' }

export default class ResultDialog extends Dialog {
    onCreate() {
        this.panelWidth = 500
        this.panelHeight = 360

        this.createPanel()
        this.createTitle()
        this.createStats()
    }

    onResize(screen) {
        this.position.set(screen.width / 2, screen.height / 2)
    }

    createPanel() {
        const panelBg = new PIXI.Graphics()
        panelBg.beginFill(theme.panelBg, 0.9)
        panelBg.drawRoundedRect(-this.panelWidth / 2, -this.panelHeight / 2, this.panelWidth, this.panelHeight, 15)
        panelBg.endFill()

        panelBg.lineStyle(3, theme.panelBorder, 0.8)
        panelBg.drawRoundedRect(-this.panelWidth / 2, -this.panelHeight / 2, this.panelWidth, this.panelHeight, 15)

        this.addChild(panelBg)
    }

    createTitle() {
        const win = this.app.data.levelEndType === 1

        this.titleText = new PIXI.Text(win ? '关卡胜利' : '关卡失败', {
            fontFamily: theme.fontFamily,
            fontSize: 32,
            fill: win ? theme.win : theme.lose,
            align: 'center',
            fontWeight: 'bold',
        })
        this.titleText.anchor.set(0.5, 0)
        this.titleText.position.set(0, -this.panelHeight / 2 + 30)
        this.addChild(this.titleText)
    }

    createStats() {
        const textStyle = new PIXI.TextStyle({
            fontFamily: theme.fontFamily,
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'left',
        })

        this.timeText = new PIXI.Text(`关卡用时: ${this.app.getFormattedLevelTime()}`, textStyle)
        this.timeText.position.set(-this.panelWidth / 2 + 40, -this.panelHeight / 2 + 100)
        this.addChild(this.timeText)
    }

    onAction() {
        if (this.app.data.levelEndType === 1) {
            if (this.isLastLevel()) {
                this.onBackToStart()
            } else {
                this.onNextLevel()
            }
        } else {
            this.onRestart()
        }
    }

    onBackToStart() {
        this.app.dialogMgr.replace(StartDialog)
    }

    onRestart() {
        this.app.data.playerStarLevel = 0
        this.app.resetOneLevelData()
        this.app.dialogMgr.replace(PlayDialog)
    }

    onNextLevel() {
        this.app.data.levelId++
        this.app.resetOneLevelData()
        this.app.dialogMgr.replace(PlayDialog)
    }

    isLastLevel() {
        return this.app.data.levelId >= allLevels.length - 1
    }

    onControl(control, pressed) {
        if (pressed && (control === 'a' || control === 'start')) this.onAction()
    }
}
