import * as PIXI from 'pixi.js'
import { theme } from './theme.js'

const HudGap = 40

export default class PlayHudView extends PIXI.Container {
    constructor(dialog) {
        super()
        this.dialog = dialog
        this.app = dialog.app

        this.panelWidth = 300
        this.panelHeight = 600
        this.barHeight = 90
    }

    init() {
        this.createVerticalPanel()
        this.createHorizontalBar()
    }

    createVerticalPanel() {
        this.verticalPanel = this.addChild(new PIXI.Container())

        const panelBg = new PIXI.Graphics()
        panelBg.beginFill(theme.panelBg, 0.8)
        panelBg.drawRoundedRect(0, -this.panelHeight / 2, this.panelWidth, this.panelHeight, 10)
        panelBg.endFill()
        panelBg.lineStyle(2, theme.panelBorder, 0.8)
        panelBg.drawRoundedRect(0, -this.panelHeight / 2, this.panelWidth, this.panelHeight, 10)
        this.verticalPanel.addChild(panelBg)

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
        this.verticalPanel.addChild(titleText)

        this.vLevelText = new PIXI.Text('关卡: 1', textStyle)
        this.vLevelText.x = 30
        this.vLevelText.y = -this.panelHeight / 2 + 80
        this.verticalPanel.addChild(this.vLevelText)

        this.vLivesText = new PIXI.Text('生命: 3', textStyle)
        this.vLivesText.x = 30
        this.vLivesText.y = -this.panelHeight / 2 + 120
        this.verticalPanel.addChild(this.vLivesText)

        this.vEnemyText = new PIXI.Text('剩余敌人: 0/0', textStyle)
        this.vEnemyText.x = 30
        this.vEnemyText.y = -this.panelHeight / 2 + 160
        this.verticalPanel.addChild(this.vEnemyText)

        const line = new PIXI.Graphics()
        line.lineStyle(2, 0xFFFFFF, 0.5)
        line.moveTo(30, -this.panelHeight / 2 + 200)
        line.lineTo(this.panelWidth - 30, -this.panelHeight / 2 + 200)
        this.verticalPanel.addChild(line)
    }

    createHorizontalBar() {
        this.horizontalBar = this.addChild(new PIXI.Container())

        this.horizontalBarBg = new PIXI.Graphics()
        this.horizontalBar.addChild(this.horizontalBarBg)

        const textStyle = new PIXI.TextStyle({
            fontFamily: theme.fontFamily,
            fontSize: 18,
            fill: 0xFFFFFF,
            align: 'left'
        })

        this.hLevelText = new PIXI.Text('关卡: 1', textStyle)
        this.hLivesText = new PIXI.Text('生命: 3', textStyle)
        this.hEnemyText = new PIXI.Text('剩余敌人: 0/0', textStyle)
        ;[this.hLevelText, this.hLivesText, this.hEnemyText].forEach((text) => {
            text.anchor.set(0, 0.5)
            this.horizontalBar.addChild(text)
        })
    }

    layout(screen, viewport, portrait) {
        this.verticalPanel.visible = !portrait
        this.horizontalBar.visible = portrait

        if (portrait) {
            this.layoutHorizontalBar(screen)
        } else {
            this.verticalPanel.position.set(viewport.x + viewport.width + HudGap, screen.height / 2)
        }
    }

    layoutHorizontalBar(screen) {
        this.horizontalBarBg.clear()
        this.horizontalBarBg.beginFill(theme.panelBg, 0.8)
        this.horizontalBarBg.drawRect(0, 0, screen.width, this.barHeight)
        this.horizontalBarBg.endFill()

        const midY = this.barHeight / 2
        const gap = Math.max(20, screen.width * 0.04)
        this.hLevelText.position.set(gap, midY)
        this.hLivesText.position.set(screen.width / 3, midY)
        this.hEnemyText.position.set(screen.width * 2 / 3, midY)
    }

    updateView() {
        const app = this.app
        const levelText = `关卡: ${app.data.levelId + 1}`
        const livesText = `生命: ${app.data.playerLives}`

        this.vLevelText.text = levelText
        this.vLivesText.text = livesText
        this.hLevelText.text = levelText
        this.hLivesText.text = livesText

        this.updateEnemyInfo()
    }

    updateEnemyInfo() {
        const gameView = this.dialog.gameView
        const totalEnemies = gameView.map.config.totalEnemies
        const remainingEnemies = this.dialog.enemySpawner.getRemainingEnemies()
        const enemyText = `剩余敌人: ${remainingEnemies}/${totalEnemies}`

        this.vEnemyText.text = enemyText
        this.hEnemyText.text = enemyText
    }
}
