import * as PIXI from 'pixi.js'
import { theme } from './theme.js'

const HudSourceWidth = 192
export const HudScale = 0.75
export const HudWidth = HudSourceWidth * HudScale
const HudHeight = 832
const MaxEnemies = 40

function createTankIcon(color, markColor) {
    const icon = new PIXI.Graphics()
    icon.beginFill(color)
    icon.drawRect(-14, -14, 6, 28)
    icon.drawRect(8, -14, 6, 28)
    icon.drawRect(-8, -11, 16, 22)
    icon.drawRect(-3, -22, 6, 11)
    icon.endFill()
    if (markColor !== undefined) {
        icon.beginFill(markColor)
        icon.drawRect(-3, -3, 6, 6)
        icon.endFill()
    }
    return icon
}

export default class PlayHudView extends PIXI.Container {
    constructor(dialog) {
        super()
        this.dialog = dialog
        this.app = dialog.app
    }

    init() {
        const background = this.addChild(new PIXI.Graphics())
        background.beginFill(0xD1D8D5)
        background.drawRect(0, 0, HudSourceWidth, HudHeight)
        background.endFill()

        this.enemyIcons = Array.from({ length: MaxEnemies }, () => {
            const icon = createTankIcon(0x242424, 0x9d211b)
            this.addChild(icon)
            return icon
        })

        const labelStyle = {
            fontFamily: theme.fontFamily,
            fontWeight: 'bold',
            fill: 0x202020,
        }
        const playerLabel = new PIXI.Text('1P', { ...labelStyle, fontSize: 34 })
        playerLabel.anchor.set(0.5)
        playerLabel.position.set(HudSourceWidth / 2, 606)
        this.addChild(playerLabel)

        const playerIcon = createTankIcon(theme.gold, theme.orange)
        playerIcon.scale.set(1.25)
        playerIcon.position.set(66, 660)
        this.addChild(playerIcon)

        this.livesText = new PIXI.Text('3', { ...labelStyle, fontSize: 42 })
        this.livesText.anchor.set(0.5)
        this.livesText.position.set(126, 660)
        this.addChild(this.livesText)

        const flag = new PIXI.Graphics()
        flag.lineStyle(7, 0x292929)
        flag.moveTo(-31, -33)
        flag.lineTo(-31, 34)
        flag.beginFill(theme.orange)
        flag.moveTo(-25, -29)
        flag.lineTo(33, -8)
        flag.lineTo(-25, 13)
        flag.closePath()
        flag.endFill()
        flag.position.set(HudSourceWidth / 2, 746)
        this.addChild(flag)

        this.levelText = new PIXI.Text('1', { ...labelStyle, fontSize: 40 })
        this.levelText.anchor.set(0.5)
        this.levelText.position.set(HudSourceWidth / 2, 804)
        this.addChild(this.levelText)
    }

    updateView() {
        this.levelText.text = String(this.app.data.levelId + 1)
        this.livesText.text = String(this.app.data.playerLives)
        this.updateEnemyInfo()
    }

    updateEnemyInfo() {
        const total = this.dialog.gameView.map.config.totalEnemies
        const remaining = this.dialog.enemySpawner.getRemainingEnemies()
        const columns = total <= 20 ? 2 : 4
        const size = total <= 20 ? 38 : 26
        const gapX = total <= 20 ? 54 : 39
        const gapY = total <= 20 ? 48 : 31
        const startX = (HudSourceWidth - (columns - 1) * gapX) / 2

        this.enemyIcons.forEach((icon, index) => {
            icon.visible = index < remaining
            icon.position.set(startX + index % columns * gapX, 34 + Math.floor(index / columns) * gapY)
            icon.scale.set(size / 44)
        })
    }
}
