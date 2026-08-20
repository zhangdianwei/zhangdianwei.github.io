import * as PIXI from 'pixi.js'
import PlayMap from './PlayMap.js'
import PlayPlayer from './PlayPlayer.js'
import PlayHome from './PlayHome.js'
import PlayBulletSpark from './PlayBulletSpark.js'
import PlayPowerUp, { PowerUpType } from './PlayPowerUp.js'
import { createSpriteSeqAnim } from './PlaySpriteSeqAnim.js'
import { TileSize, MapWidth, MapHeight, TankBoundaryThreshold, TankSize, TankType } from './TileType.js'

const PowerUpCells = [3, 9, 16, 22].flatMap((row) =>
    [3, 9, 16, 22].map((col) => ({ row, col })))
const PowerUpRates = [
    ['life', PowerUpType.TANK],
    ['stop', PowerUpType.CLOCK],
    ['iron', PowerUpType.SHOVEL],
    ['bomb', PowerUpType.GRENADE],
    ['star', PowerUpType.STAR],
    ['shield', PowerUpType.HELMET],
]

export default class PlayGameView extends PIXI.Container {
    constructor(dialog) {
        super()
        this.dialog = dialog
        this.app = dialog.app
    }

    init() {
        this.tileRoot = this.addChild(new PIXI.Container())
        this.tileRoot.position.set(-MapWidth / 2, -MapHeight / 2)
        this.createMapBorder()
        this.createRenderLayers()

        this.map = new PlayMap(this.dialog)
        this.map.setRenderLayers(this.renderLayers)

        this.home = null
        this.player = null
        this.enemies = []
        this.playerBullets = []
        this.enemyBullets = []
        this.effects = []
        this.powerUps = []
        this.powerUpEffects = []
    }

    layout(viewport) {
        const scale = Math.min(viewport.width / MapWidth, viewport.height / MapHeight)
        this.scale.set(scale)
        this.position.set(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2)
    }

    createMapBorder() {
        const border = new PIXI.Graphics()
        border.beginFill(0x1B2524)
        border.lineStyle(2, 0xD5DEDB, 0.65)
        border.drawRoundedRect(-MapWidth / 2, -MapHeight / 2, MapWidth, MapHeight, 6)
        border.endFill()
        this.addChildAt(border, 0)
    }

    createRenderLayers() {
        this.renderLayers = {
            background: this.tileRoot.addChild(new PIXI.Container()), // 空地背景
            tiles: this.tileRoot.addChild(new PIXI.Container()),      // 砖块、铁块、水面等小方块
            tank: this.tileRoot.addChild(new PIXI.Container()),       // 坦克层（玩家、敌人、基地）
            bullets: this.tileRoot.addChild(new PIXI.Container()),    // 子弹层
            grass: this.tileRoot.addChild(new PIXI.Container()),      // 草地（装饰层）
            items: this.tileRoot.addChild(new PIXI.Container()),
            effect: this.tileRoot.addChild(new PIXI.Container()),     // 效果层
        }
    }

    addBullet(bullet) {
        if (bullet.bulletType === 'player') {
            this.playerBullets.push(bullet)
        } else {
            this.enemyBullets.push(bullet)
        }
        this.renderLayers.bullets.addChild(bullet)
    }

    removeBullet(bullet) {
        this.renderLayers.bullets.removeChild(bullet)

        const list = bullet.bulletType === 'player' ? this.playerBullets : this.enemyBullets
        const index = list.indexOf(bullet)
        if (index !== -1) list.splice(index, 1)
    }

    addEnemy(enemy) {
        this.enemies.push(enemy)
        this.renderLayers.tank.addChild(enemy)
    }

    removeEnemy(enemy) {
        this.renderLayers.tank.removeChild(enemy)
        const index = this.enemies.indexOf(enemy)
        if (index === -1) return
        this.enemies.splice(index, 1)
    }

    addPlayer(player) {
        this.player = player
        this.renderLayers.tank.addChild(player)
    }

    removePlayer() {
        this.renderLayers.tank.removeChild(this.player)
        this.player = null
    }

    addEffect(effectName, x, y, callback) {
        const effect = createSpriteSeqAnim(this.app, effectName, () => {
            const index = this.effects.indexOf(effect)
            if (index !== -1) this.effects.splice(index, 1)
            callback?.()
        })
        effect.x = x
        effect.y = y
        this.renderLayers.effect.addChild(effect)
        this.effects.push(effect)
    }

    addBulletSpark(x, y) {
        const effect = new PlayBulletSpark(() => {
            const index = this.effects.indexOf(effect)
            if (index !== -1) this.effects.splice(index, 1)
        })
        effect.position.set(
            Math.max(1, Math.min(MapWidth - 1, x)),
            Math.max(1, Math.min(MapHeight - 1, y)),
        )
        this.renderLayers.effect.addChild(effect)
        this.effects.push(effect)
    }

    updateEffects(deltaTime) {
        this.effects.slice().forEach((effect) => effect.update(deltaTime))
    }

    spawnPowerUp() {
        let roll = Math.random()
        const rates = this.map.config.itemDropRates || {}
        const entry = PowerUpRates.find(([key]) => {
            roll -= rates[key] || 0
            return roll < 0
        })
        if (!entry) return

        this.powerUps.slice().forEach((powerUp) => {
            this.removePowerUp(powerUp)
            powerUp.destroy({ children: true })
        })
        const available = PowerUpCells.filter(({ row, col }) => {
            const bounds = { x: col * TileSize, y: row * TileSize, width: TankSize, height: TankSize }
            return this.map.isRectWalkable(bounds.x, bounds.y, TankSize / 2) &&
                this.powerUps.every((item) => !this.dialog.ruleMgr.checkBoundsOverlap(bounds, item.getBounds()))
        })
        const cells = available.length ? available : PowerUpCells
        const cell = cells[Math.floor(Math.random() * cells.length)]
        const powerUp = new PlayPowerUp(this.dialog, entry[1])
        powerUp.position.set(cell.col * TileSize, cell.row * TileSize)
        this.renderLayers.items.addChild(powerUp)
        this.powerUps.push(powerUp)
    }

    removePowerUp(powerUp) {
        powerUp.removeFromParent()
        const index = this.powerUps.indexOf(powerUp)
        if (index !== -1) this.powerUps.splice(index, 1)
    }

    collectPowerUp(powerUp, player) {
        const globalPosition = powerUp.getGlobalPosition()
        const worldScale = Math.hypot(powerUp.worldTransform.a, powerUp.worldTransform.b)
        this.removePowerUp(powerUp)
        this.dialog.addChild(powerUp)
        powerUp.position.copyFrom(this.dialog.toLocal(globalPosition))
        powerUp.scale.set(worldScale)
        this.powerUpEffects.push(powerUp)

        const finish = () => {
            powerUp.removeFromParent()
            const index = this.powerUpEffects.indexOf(powerUp)
            if (index !== -1) this.powerUpEffects.splice(index, 1)
            powerUp.destroy({ children: true })
        }
        const apply = () => this.dialog.ruleMgr.applyPowerUp(powerUp.type, player)
        const flyTo = (target, options, afterApply) => {
            powerUp.startFlight(this.dialog.toLocal(target), {
                endScale: worldScale * 0.62,
                ...options,
            }, () => {
                apply()
                afterApply?.()
                finish()
            })
        }

        const hudFlight = {
            [PowerUpType.STAR]: { arc: 68, tilt: 0.28 },
            [PowerUpType.HELMET]: { arc: 42, tilt: -0.14 },
            [PowerUpType.CLOCK]: { arc: 54, tilt: 0.2 },
        }
        if (hudFlight[powerUp.type]) {
            const target = this.dialog.hudView.reservePowerUp(powerUp.type)
            flyTo(target, hudFlight[powerUp.type], () => this.dialog.hudView.commitPowerUp(powerUp.type))
            return
        }
        if (powerUp.type === PowerUpType.TANK) {
            flyTo(this.dialog.hudView.getPowerUpTargetGlobal(powerUp.type), { arc: 46, tilt: -0.12 })
            return
        }
        if (powerUp.type === PowerUpType.SHOVEL) {
            flyTo(this.home.getGlobalPosition(), { arc: 58, tilt: 0.18 }, () => this.addHomeWallTransformEffect())
            return
        }

        apply()
        powerUp.startBurst(0xFF5A3D, 0.48, finish)
    }

    addHomeWallTransformEffect() {
        this.map.getHomeWallCells().forEach(({ row, col }) => {
            this.addBulletSpark((col + 0.5) * TileSize, (row + 0.5) * TileSize)
        })
    }

    updatePowerUp(deltaTime) {
        this.powerUps.slice().forEach((powerUp) => powerUp.update(deltaTime))
        this.powerUpEffects.slice().forEach((powerUp) => powerUp.update(deltaTime))
    }

    startLevel(levelId) {
        this.clearLevel()
        this.map.loadLevel(levelId)
        this.createHome()
    }

    clearLevel() {
        this.home = null
        this.player = null
        this.enemies = []
        this.playerBullets = []
        this.enemyBullets = []
        this.effects = []
        this.powerUps = []
        this.powerUpEffects.forEach((powerUp) => powerUp.removeFromParent())
        this.powerUpEffects = []

        for (const name in this.renderLayers) {
            this.renderLayers[name]?.removeChildren()
        }
    }

    createPlayer() {
        const baseRow = this.map.mapRows - 1
        const baseCol = this.map.mapCols / 2 - 1
        const playerRow = baseRow
        const playerCol = baseCol - 2
        const position = { x: playerCol * TileSize, y: playerRow * TileSize }
        const size = TankSize - TankBoundaryThreshold * 2
        const bounds = { ...position, width: size, height: size }
        const occupied = this.enemies.some((enemy) => !enemy.isDead &&
            this.dialog.ruleMgr.checkBoundsOverlap(bounds, enemy.getOccupancyBounds()))
        if (occupied) return false

        if (this.player?.parent) {
            this.player.parent.removeChild(this.player)
        }

        this.player = new PlayPlayer(this.dialog, TankType.PLAYER)
        this.renderLayers.tank.addChild(this.player)

        this.player.position.set(position.x, position.y)

        this.player.appear()
        this.dialog.inputMgr?.syncPlayer()
        return true
    }

    createHome() {
        if (this.home?.parent) {
            this.home.parent.removeChild(this.home)
        }

        // 基地固定创建在最下面一行的中心
        const homeRow = this.map.mapRows - 1
        const homeCol = this.map.mapCols / 2 - 1

        this.home = new PlayHome(this.dialog)
        this.home.x = homeCol * TileSize + TileSize
        this.home.y = (homeRow - 1) * TileSize + TileSize

        this.renderLayers.tank.addChild(this.home)
    }
}
