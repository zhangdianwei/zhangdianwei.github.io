import * as PIXI from 'pixi.js'
import PlayMap from './PlayMap.js'
import PlayPlayer from './PlayPlayer.js'
import PlayHome from './PlayHome.js'
import { createSpriteSeqAnim } from './PlaySpriteSeqAnim.js'
import { TileSize, MapWidth, MapHeight, TankType } from './TileType.js'

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

    updateEffects(deltaTime) {
        this.effects.slice().forEach((effect) => effect.update(deltaTime))
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

        for (const name in this.renderLayers) {
            this.renderLayers[name]?.removeChildren()
        }
    }

    createPlayer() {
        if (this.player?.parent) {
            this.player.parent.removeChild(this.player)
        }

        this.player = new PlayPlayer(this.dialog, TankType.PLAYER)
        this.renderLayers.tank.addChild(this.player)

        // 设置玩家初始位置（基地左边2个格子）
        const baseRow = this.map.mapRows - 1
        const baseCol = this.map.mapCols / 2 - 1
        const playerRow = baseRow
        const playerCol = baseCol - 2
        this.player.x = playerCol * TileSize
        this.player.y = playerRow * TileSize

        this.player.appear()
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
