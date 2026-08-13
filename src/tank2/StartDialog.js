import * as PIXI from 'pixi.js'
import { Dialog } from '../game-guide/index.js'
import TankButton from './TankButton.js'
import PlayDialog from './PlayDialog.js'
import { theme } from './theme.js'

export default class StartDialog extends Dialog {
    onCreate() {
        this.createTitle()
        this.createButtons()
        this.createDecorativeBorder()
    }

    onResize(screen) {
        this.position.set(screen.width / 2, screen.height / 2)
    }

    createTitle() {
        this.titleText = new PIXI.Text('坦克大战', {
            fontFamily: theme.fontFamily,
            fontSize: 72,
            fontWeight: 'bold',
            fill: theme.gold,
            align: 'center',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 8,
            dropShadowDistance: 4,
            stroke: theme.brown,
            strokeThickness: 3,
        })
        this.titleText.anchor.set(0.5, 0.5)
        this.titleText.position.set(0, -140)
        this.addChild(this.titleText)

        const subtitleText = new PIXI.Text('TANK BATTLE', {
            fontFamily: theme.fontFamily,
            fontSize: 32,
            fontWeight: 'bold',
            fill: theme.orange,
            align: 'center',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 4,
            dropShadowDistance: 2,
        })
        subtitleText.anchor.set(0.5, 0.5)
        subtitleText.position.set(0, -85)
        this.addChild(subtitleText)
    }

    createButtons() {
        const startButton = new TankButton(this.app, '开始游戏', () => this.onSinglePlayer())
        startButton.position.set(0, 60)
        this.addChild(startButton)
    }

    createDecorativeBorder() {
        const width = 700
        const height = 500
        const cornerSize = 20

        const border = new PIXI.Graphics()
        border.lineStyle(4, theme.gold, 0.8)
        border.drawRoundedRect(-width / 2, -height / 2, width, height, cornerSize)

        const corners = [
            { x: -width / 2 + cornerSize, y: -height / 2 + cornerSize },
            { x: width / 2 - cornerSize, y: -height / 2 + cornerSize },
            { x: -width / 2 + cornerSize, y: height / 2 - cornerSize },
            { x: width / 2 - cornerSize, y: height / 2 - cornerSize },
        ]
        corners.forEach((corner) => {
            border.beginFill(theme.gold, 0.3)
            border.drawRect(corner.x - cornerSize / 2, corner.y - cornerSize / 2, cornerSize, cornerSize)
            border.endFill()
        })

        this.addChildAt(border, 0)
    }

    onSinglePlayer() {
        this.app.resetPlayerData()
        this.app.dialogMgr.replace(PlayDialog)
    }
}
