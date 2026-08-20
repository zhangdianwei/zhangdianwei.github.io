import PlayTankBase from './PlayTankBase.js'
import { Dir, TankType, TileSize } from './TileType.js'

const AI_CONFIG = {
    [TankType.ENEMY_1]: { direction: [1.4, 2.8], shoot: [1.2, 2.2], shootChance: 0.55, aimChance: 0.75, playerFocus: 0.45, pursuit: 1.6 },
    [TankType.ENEMY_2]: { direction: [0.7, 1.5], shoot: [1.8, 3], shootChance: 0.45, aimChance: 0.65, playerFocus: 0.6, pursuit: 1.25 },
    [TankType.ENEMY_3]: { direction: [1, 2.1], shoot: [0.65, 1.3], shootChance: 0.75, aimChance: 0.9, playerFocus: 0.75, pursuit: 2 },
    [TankType.ENEMY_4]: { direction: [1.4, 2.7], shoot: [1, 1.9], shootChance: 0.65, aimChance: 0.8, playerFocus: 0.3, pursuit: 2.2 },
}

const DIRECTIONS = [Dir.UP, Dir.RIGHT, Dir.DOWN, Dir.LEFT]
const DIRECTION_WEIGHTS = {
    [Dir.UP]: 0.75,
    [Dir.RIGHT]: 0.9,
    [Dir.DOWN]: 1.25,
    [Dir.LEFT]: 0.9,
}

export default class PlayEnemy extends PlayTankBase {
    constructor(dialog, tankType) {
        super(dialog, tankType)
        this.aiConfig = AI_CONFIG[tankType]
        this.blockedTime = 0
        this.resetDirectionTimer()
        this.resetShootDecisionTimer()
    }

    random(min, max) {
        return Math.random() * (max - min) + min
    }

    onAppearFinish() {
        super.onAppearFinish()
        this.setShooting(false)
        this.chooseDirection()
        this.setMoving(true)
    }

    resetDirectionTimer() {
        this.directionTimer = this.random(...this.aiConfig.direction)
    }

    resetShootDecisionTimer() {
        this.shootDecisionTimer = this.random(...this.aiConfig.shoot)
    }

    update(deltaTime, frozen = false) {
        if (frozen) {
            if (this.appearAnim) super.update(deltaTime)
            else this.checkInvincible(deltaTime)
            return
        }
        if (!this.appearAnim) this.checkAI(deltaTime)
        super.update(deltaTime)
    }

    checkAI(deltaTime) {
        this.directionTimer -= deltaTime
        this.shootDecisionTimer -= deltaTime

        const blocked = this.handleBlocked(deltaTime)
        if (!blocked && this.directionTimer <= 0) {
            this.chooseDirection()
            this.resetDirectionTimer()
        }

        if (this.shootDecisionTimer <= 0) {
            this.tryShoot()
            this.resetShootDecisionTimer()
        }
    }

    handleBlocked(deltaTime) {
        const bounds = this.getOccupancyBounds()
        const mapDistance = this.dialog.gameView.map.getMovableDistance(bounds, this.direction)
        const tankDistance = this.dialog.ruleMgr.getMovableDistance(bounds, this.direction, this)
        if (Math.min(mapDistance, tankDistance) > 0.5) {
            this.blockedTime = 0
            return false
        }

        const blockedByMap = mapDistance <= 0.5
        if (blockedByMap) this.requestShoot()
        this.blockedTime += deltaTime
        if (this.blockedTime < (blockedByMap ? 0.4 : 0.1)) return true

        this.blockedTime = 0
        this.shootOnce = false
        this.chooseDirection(true)
        this.resetDirectionTimer()
        return true
    }

    chooseDirection(blocked = false) {
        const oldDirection = this.direction
        const reverseDirection = (oldDirection + 2) % 4
        const available = DIRECTIONS.map((dir) => ({ dir, distance: this.getAllowedDistance(dir) }))
        let candidates = available.filter(({ distance }) => distance >= TileSize / 2)

        if (!candidates.length) {
            candidates = available.filter(({ distance }) => distance > 0.5)
        }
        if (!candidates.length) return

        const target = this.chooseTarget()
        const dx = target ? target.x - this.x : 0
        const dy = target ? target.y - this.y : 0
        const totalDelta = Math.abs(dx) + Math.abs(dy) || 1
        let totalWeight = 0
        const weighted = candidates.map(({ dir }) => {
            const progress = this.getTargetProgress(dir, dx, dy) / totalDelta
            let weight = DIRECTION_WEIGHTS[dir] * (1 + progress * this.aiConfig.pursuit)
            if (dir === oldDirection) weight *= blocked ? 0.1 : 1.65
            if (dir === reverseDirection) weight *= blocked ? 0.7 : 0.25
            totalWeight += weight
            return { dir, weight }
        })

        let value = Math.random() * totalWeight
        for (const item of weighted) {
            value -= item.weight
            if (value <= 0) {
                this.setDirection(item.dir)
                return
            }
        }
        this.setDirection(weighted.at(-1).dir)
    }

    chooseTarget() {
        const { player, home } = this.dialog.gameView
        const hasPlayer = player && !player.isDead
        const hasHome = home && !home.isDead
        if (hasPlayer && hasHome) return Math.random() < this.aiConfig.playerFocus ? player : home
        return hasPlayer ? player : hasHome ? home : null
    }

    getTargetProgress(direction, dx, dy) {
        if (direction === Dir.UP) return Math.max(0, -dy)
        if (direction === Dir.RIGHT) return Math.max(0, dx)
        if (direction === Dir.DOWN) return Math.max(0, dy)
        return Math.max(0, -dx)
    }

    tryShoot() {
        const attackDirection = this.findAttackDirection()
        if (attackDirection !== null && Math.random() < this.aiConfig.aimChance) {
            this.setDirection(attackDirection)
            this.resetDirectionTimer()
            this.requestShoot()
            return
        }
        if (Math.random() < this.aiConfig.shootChance) this.requestShoot()
    }

    requestShoot() {
        if (this.shootTimer > 0 || this.currentBullets >= this.maxBullets) return
        this.setShootOnce()
    }

    findAttackDirection() {
        const { player, home } = this.dialog.gameView
        for (const target of [player, home]) {
            const direction = this.getLineDirection(target)
            if (direction !== null && this.isTargetVisible(target, direction)) return direction
        }
        return null
    }

    getLineDirection(target) {
        if (!target || target.isDead) return null
        const targetBounds = target.getBounds()
        const selfBounds = this.getBounds()
        const laneX = (selfBounds.width + targetBounds.width) / 4
        const laneY = (selfBounds.height + targetBounds.height) / 4
        const dx = targetBounds.x - selfBounds.x
        const dy = targetBounds.y - selfBounds.y
        if (Math.abs(dx) <= laneX && Math.abs(dy) > laneY) return dy < 0 ? Dir.UP : Dir.DOWN
        if (Math.abs(dy) <= laneY && Math.abs(dx) > laneX) return dx < 0 ? Dir.LEFT : Dir.RIGHT
        return null
    }

    isTargetVisible(target, direction) {
        const targetBounds = target.getBounds()
        const selfBounds = this.getOccupancyBounds()
        const vertical = direction === Dir.UP || direction === Dir.DOWN
        const distance = vertical
            ? Math.abs(targetBounds.y - selfBounds.y) - (targetBounds.height + selfBounds.height) / 2
            : Math.abs(targetBounds.x - selfBounds.x) - (targetBounds.width + selfBounds.width) / 2
        return distance >= 0 && this.dialog.gameView.map.getMovableDistance(selfBounds, direction) >= distance
    }
}
