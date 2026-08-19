import * as PIXI from 'pixi.js'
import { theme } from './theme.js'
import { PowerUpType } from './PlayPowerUp.js'

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
        this.enemyCountText = new PIXI.Text('x0', { ...labelStyle, fontSize: 38 })
        this.enemyCountText.anchor.set(0.5)
        this.enemyCountText.position.set(124, 70)
        this.addChild(this.enemyCountText)
        this.createPowerUpArea(labelStyle)

        const playerLabel = new PIXI.Text('1P', { ...labelStyle, fontSize: 34 })
        playerLabel.anchor.set(0.5)
        playerLabel.position.set(HudSourceWidth / 2, 606)
        this.addChild(playerLabel)

        const playerIcon = createTankIcon(theme.gold, theme.orange)
        playerIcon.scale.set(1.25)
        playerIcon.position.set(66, 660)
        this.addChild(playerIcon)

        this.livesText = new PIXI.Text('2', { ...labelStyle, fontSize: 42 })
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

    createPowerUpArea(labelStyle) {
        this.powerUpOrder = []
        this.pendingPowerUps = new Set()
        this.powerUpSlots = {}

        const createSlot = (type, texture) => {
            const root = this.addChild(new PIXI.Container())
            root.position.set(40, 535)
            root.visible = false
            const icon = root.addChild(new PIXI.Sprite(this.app.textures[texture]))
            icon.anchor.set(0.5)
            icon.width = 42
            icon.height = 42
            this.powerUpSlots[type] = { root, icon, targetX: 40 }
            return this.powerUpSlots[type]
        }

        const star = createSlot(PowerUpType.STAR, 'itemStar')
        const helmet = createSlot(PowerUpType.HELMET, 'itemHelmet')
        const clock = createSlot(PowerUpType.CLOCK, 'itemClock')
        helmet.ring = helmet.root.addChild(new PIXI.Graphics())
        clock.ring = clock.root.addChild(new PIXI.Graphics())

        star.count = star.root.addChild(new PIXI.Text('x0', {
            ...labelStyle,
            fontSize: 18,
            stroke: 0xF2F5F3,
            strokeThickness: 4,
        }))
        star.count.anchor.set(0.5)
        star.count.position.set(17, 17)
    }

    updateView() {
        this.levelText.text = String(this.app.data.levelId + 1)
        this.livesText.text = String(this.app.data.playerLives)
        this.updateEnemyInfo()
        this.updatePowerUpStatus()
    }

    updatePowerUpStatus() {
        const ruleMgr = this.dialog.ruleMgr
        const starLevel = this.app.data.playerStarLevel || 0
        const active = {
            [PowerUpType.STAR]: starLevel > 0,
            [PowerUpType.HELMET]: ruleMgr.helmetTime > 0,
            [PowerUpType.CLOCK]: ruleMgr.enemyFreezeTime > 0,
        }
        this.powerUpOrder = this.powerUpOrder.filter((type) => active[type] || this.pendingPowerUps.has(type))
        this.powerUpOrder.forEach((type, index) => {
            this.powerUpSlots[type].targetX = 40 + index * 56
        })
        Object.entries(this.powerUpSlots).forEach(([type, slot]) => {
            slot.root.visible = !!active[type]
            slot.root.x += (slot.targetX - slot.root.x) * 0.22
        })
        this.powerUpSlots[PowerUpType.STAR].count.text = `x${starLevel}`
        this.drawTimer(this.powerUpSlots[PowerUpType.HELMET].ring, ruleMgr.helmetTime, 0x55B8FF)
        this.drawTimer(this.powerUpSlots[PowerUpType.CLOCK].ring, ruleMgr.enemyFreezeTime, 0xF4A629)
    }

    drawTimer(graphics, remaining, color) {
        graphics.clear()
        if (remaining <= 0) return
        graphics.lineStyle(5, 0x6D7975, 0.45)
        graphics.drawCircle(0, 0, 27)
        graphics.lineStyle(5, color, 1)
        graphics.arc(0, 0, 27, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, remaining / 10))
    }

    getPowerUpTargetGlobal(type) {
        const target = type === PowerUpType.TANK ? this.livesText : this.powerUpSlots[type].root
        return target.getGlobalPosition()
    }

    reservePowerUp(type) {
        if (!this.powerUpOrder.includes(type)) {
            this.powerUpOrder.push(type)
            const slot = this.powerUpSlots[type]
            slot.root.x = 40 + (this.powerUpOrder.length - 1) * 56
            slot.targetX = slot.root.x
        }
        this.pendingPowerUps.add(type)
        return this.getPowerUpTargetGlobal(type)
    }

    commitPowerUp(type) {
        this.pendingPowerUps.delete(type)
        this.updatePowerUpStatus()
    }

    updateEnemyInfo() {
        const remaining = this.dialog.enemySpawner.getRemainingEnemies()
        this.enemyIcons.forEach((icon, index) => {
            icon.visible = index === 0 && remaining > 0
            icon.position.set(52, 70)
            icon.scale.set(1)
        })
        this.enemyCountText.visible = remaining > 0
        this.enemyCountText.text = `x${remaining}`
    }
}
