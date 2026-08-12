import * as PIXI from 'pixi.js'
import BgCircle from './PlayBgCircle.js'
import Cube from './PlayCube.js'
import EnermySnake from './PlayEnemySnake.js'
import JoystickUI from './PlayJoystickUI.js'
import PlayerSnake from './PlayPlayerSnake.js'
import SpeedBoostUI from './PlaySpeedBoostUI.js'
import { checkSnakeCollisions } from './PlayCollision.js'

const layers = { background: 0, loose: 1, enemy: 2, player: 3 }

export default class PlayMgr {
    constructor(initialValue = 2, onFinish) {
        this.initialLevel = Math.log2(initialValue)
        this.onFinish = onFinish
        this.radius = 960
        this.finished = false
        this.elapsed = 0
    }

    init(dialog) {
        this.dialog = dialog
        this.app = dialog.app
        this.app.data.rankList = []
        this.app.data.playerRank.level = this.initialLevel
        this.root = new PIXI.Container()
        this.layerContainers = Array.from({ length: 4 }, () => new PIXI.Container())
        this.layerContainers.forEach((layer) => this.root.addChild(layer))
        dialog.addChild(this.root)

        this.addObject(new BgCircle(this.radius, this.app.textures.star), layers.background)
        this.playerSnake = new PlayerSnake(this)
        this.playerSnake.addCube(this.initialLevel)
        this.addObject(this.playerSnake, layers.player)
        this.ensureLooseCubes()
        this.createEnemySnake()

        this.joystick = new JoystickUI(this.playerSnake)
        this.speedBoost = new SpeedBoostUI(this.playerSnake)
        dialog.addChild(this.joystick, this.speedBoost)
        dialog.interval(() => this.ensureLooseCubes(), 5000)
        dialog.interval(() => this.createEnemySnake(), 5000)
        dialog.event(window, 'keydown', (event) => {
            if (event.key === 'f') this.playerSnake?.addCube(1)
        })
        dialog.event(window, 'blur', () => this.joystick?.release())
        dialog.event(document, 'visibilitychange', () => {
            if (document.hidden) this.joystick?.release()
        })
    }

    get enemySnakes() {
        return this.layerContainers[layers.enemy].children
    }

    get looseCubes() {
        return this.layerContainers[layers.loose].children
    }

    update(delta) {
        if (this.finished) return
        this.elapsed += delta?.deltaMS || 16
        this.speedBoost.update(delta)
        ;[this.playerSnake, ...this.enemySnakes].forEach((snake) => snake?.update(delta))
        checkSnakeCollisions(this)
        if (!this.playerSnake?.head) {
            this.finished = true
            this.onFinish()
            return
        }
        this.centerPlayer()
    }

    layout(screen) {
        this.screen = screen
        this.centerPlayer()
        this.joystick?.resize(screen)
        if (this.speedBoost) {
            this.speedBoost.position.set(screen.width - 72, screen.height - 72)
        }
    }

    centerPlayer() {
        if (!this.screen || !this.playerSnake?.head) return
        this.root.position.set(
            this.screen.width / 2 - this.playerSnake.head.x,
            this.screen.height / 2 - this.playerSnake.head.y,
        )
    }

    createEnemySnake() {
        if (this.enemySnakes.length >= 5) return
        const enemy = new EnermySnake(this)
        enemy.addCube(this.getEnemyHeadLevel())
        const player = this.playerSnake?.head || { x: 0, y: 0 }
        let x
        let y
        for (let i = 0; i < 10; i++) {
            const radius = Math.sqrt(Math.random()) * (this.radius - enemy.head.getSize() / 2)
            const angle = Math.random() * Math.PI * 2
            x = Math.cos(angle) * radius
            y = Math.sin(angle) * radius
            if (Math.hypot(x - player.x, y - player.y) >= this.radius * 0.6) break
        }
        enemy.setPosition(x, y)
        this.addObject(enemy, layers.enemy)
    }

    ensureLooseCubes() {
        while (this.looseCubes.length < 10) {
            const level = this.getLooseLevel()
            const cube = new Cube(this.app.textures.ship, level)
            cube.isDropped = false
            const minRadius = level >= (this.playerSnake?.head?.level || 1) - 1 ? 0 : this.radius * 0.35
            const maxRadius = this.radius - cube.getVisualRadius()
            const radius = Math.sqrt(
                Math.random() * (maxRadius ** 2 - minRadius ** 2) + minRadius ** 2,
            )
            const angle = Math.random() * Math.PI * 2
            cube.rotation = Math.random() * Math.PI * 2
            cube.setCollisionCenter(Math.cos(angle) * radius, Math.sin(angle) * radius)
            this.addObject(cube, layers.loose)
        }
    }

    addLooseCube(cube) {
        const collision = cube.getCollision()
        const center = this.root.toLocal(new PIXI.Point(collision.centerX, collision.centerY))
        cube.isDropped = true
        cube.entryProgress = 1
        cube.alpha = 1
        this.addObject(cube, layers.loose)
        cube.rotation = Math.random() * Math.PI * 2
        const maxRadius = this.radius - cube.getVisualRadius()
        const distance = Math.hypot(center.x, center.y)
        if (distance > maxRadius) {
            center.set(center.x * maxRadius / distance, center.y * maxRadius / distance)
        }
        cube.setCollisionCenter(center.x, center.y)
    }

    getLooseLevel() {
        const head = this.playerSnake?.head?.level || 1
        const roll = Math.random()
        const offset = roll < 0.45 ? 4 : roll < 0.75 ? 3 : roll < 0.9 ? 2 : roll < 0.98 ? 1 : 0
        return Math.max(1, head - offset)
    }

    getEnemyHeadLevel() {
        const head = this.playerSnake?.head?.level || 1
        const roll = Math.random()
        return roll < 0.4 ? Math.max(1, head - 1) : roll < 0.8 ? head : head + 1
    }

    rewardBoost(amount) {
        this.speedBoost?.addCharge(amount)
    }

    addObject(object, layer) {
        this.layerContainers[layer].addChild(object)
    }

    removeObject(object) {
        object.removeFromParent()
        object.destroy({ children: true })
    }

    destroy() {
        this.playerSnake = null
        this.joystick = null
        this.speedBoost = null
        this.layerContainers = null
        this.root = null
        this.onFinish = null
        this.screen = null
        this.app = null
        this.dialog = null
    }
}
