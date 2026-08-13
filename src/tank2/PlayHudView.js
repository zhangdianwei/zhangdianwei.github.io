import * as PIXI from 'pixi.js'
import { theme } from './theme.js'

export default class PlayHudView extends PIXI.Container {
    constructor(dialog) {
        super()
        this.dialog = dialog
        this.app = dialog.app

        this.panelWidth = 300
        this.panelHeight = 600
    }

    init() {
        this.createPanel()
        this.createInfoTexts()
    }

    createPanel() {
        const panelBg = new PIXI.Graphics()
        panelBg.beginFill(theme.panelBg, 0.8)
        panelBg.drawRoundedRect(0, -this.panelHeight / 2, this.panelWidth, this.panelHeight, 10)
        panelBg.endFill()

        panelBg.lineStyle(2, theme.panelBorder, 0.8)
        panelBg.drawRoundedRect(0, -this.panelHeight / 2, this.panelWidth, this.panelHeight, 10)

        this.addChild(panelBg)
    }

    createInfoTexts() {
        const textStyle = new PIXI.TextStyle({
            fontFamily: theme.fontFamily,
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'left'
        })

        const titleStyle = new PIXI.TextStyle({
            fontFamily: theme.fontFamily,
            fontSize: 28,
            fill: theme.win,
            align: 'center',
            fontWeight: 'bold'
        })

        const titleText = new PIXI.Text('游戏信息', titleStyle)
        titleText.anchor.set(0.5, 0)
        titleText.x = this.panelWidth / 2
        titleText.y = -this.panelHeight / 2 + 30
        this.addChild(titleText)

        this.levelText = new PIXI.Text('关卡: 1', textStyle)
        this.levelText.x = 30
        this.levelText.y = -this.panelHeight / 2 + 80
        this.addChild(this.levelText)

        this.livesText = new PIXI.Text('生命: 3', textStyle)
        this.livesText.x = 30
        this.livesText.y = -this.panelHeight / 2 + 120
        this.addChild(this.livesText)

        this.enemyText = new PIXI.Text('剩余敌人: 0/0', textStyle)
        this.enemyText.x = 30
        this.enemyText.y = -this.panelHeight / 2 + 160
        this.addChild(this.enemyText)

        const line = new PIXI.Graphics()
        line.lineStyle(2, 0xFFFFFF, 0.5)
        line.moveTo(30, -this.panelHeight / 2 + 200)
        line.lineTo(this.panelWidth - 30, -this.panelHeight / 2 + 200)
        this.addChild(line)
    }

    updateView() {
        const app = this.app
        this.levelText.text = `关卡: ${app.data.levelId + 1}`
        this.livesText.text = `生命: ${app.data.playerLives}`
        this.updateEnemyInfo()
    }

    updateEnemyInfo() {
        const gameView = this.dialog.gameView
        const totalEnemies = gameView.map.config.totalEnemies
        const remainingEnemies = this.dialog.enemySpawner.getRemainingEnemies()
        this.enemyText.text = `剩余敌人: ${remainingEnemies}/${totalEnemies}`
    }
}
