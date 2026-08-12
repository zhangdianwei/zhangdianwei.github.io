import Snake from './PlaySnake.js'

const behaviors = ['collector', 'hunter', 'scavenger']

export default class EnemySnake extends Snake {
    constructor(playMgr) {
        super(playMgr)
        this.rankId = playMgr.app.createEnemyId()
        this.behavior = behaviors[Math.floor(Math.random() * behaviors.length)]
        this.target = { x: 0, y: 0 }
        this.targetPlayer = false
        this.targetTimer = 0
        this.setRandomTarget()
        this.setName(playMgr.app.randomName())
    }

    updateHeadDirectionStrategy(delta) {
        this.targetTimer -= delta?.deltaMS || 16
        const playerHead = this.playMgr.playerSnake?.head
        if (
            !this.target ||
            this.target.destroyed ||
            (this.targetPlayer && (!playerHead || this.head.level <= playerHead.level))
        ) {
            this.chooseTarget()
        }
        if (this.targetTimer <= 0) this.chooseTarget()
        this.setHeadDirection(this.target.x - this.head.x, this.target.y - this.head.y)
        if (Math.hypot(this.target.x - this.head.x, this.target.y - this.head.y) < 40) {
            this.chooseTarget()
        }
    }

    chooseTarget() {
        const difficulty = Math.min(1, this.playMgr.elapsed / 300000)
        this.turnRate = 0.09 + difficulty * 0.07
        this.setBaseSpeed(3 + difficulty * 0.8)
        this.targetTimer = 2600 - difficulty * 1700
        const playerTarget = this.behavior === 'hunter' ? this.findPlayerTarget() : null
        const target = playerTarget || this.findLooseTarget(this.behavior === 'scavenger')
        this.targetPlayer = !!playerTarget
        if (target) this.target = target
        else this.setRandomTarget()
    }

    findPlayerTarget() {
        const player = this.playMgr.playerSnake
        if (!player?.head || this.head.level <= player.head.level) return null
        const target = [...player.cubes].reverse().find((cube) => cube.level < this.head.level)
        return target || this.findLooseTarget(false)
    }

    findLooseTarget(droppedOnly) {
        const cubes = this.playMgr.looseCubes.filter(
            (cube) => cube.level <= this.head.level && (!droppedOnly || cube.isDropped),
        )
        if (!cubes.length && droppedOnly) return this.findLooseTarget(false)
        return cubes.sort((a, b) => {
            if (droppedOnly && a.level !== b.level) return b.level - a.level
            return this.distanceTo(a) - this.distanceTo(b)
        })[0]
    }

    distanceTo(target) {
        return Math.hypot(target.x - this.head.x, target.y - this.head.y)
    }

    setRandomTarget() {
        this.targetPlayer = false
        const angle = Math.random() * Math.PI * 2
        const radius = Math.sqrt(Math.random()) * (this.playMgr.radius - 80)
        this.target = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
    }

    onHeadValueChanged() {
        this.playMgr.app.updateRankList(this.rankId, this.name, this.head.level)
    }

    onRemoved() {
        this.playMgr.app.removeRank(this.rankId)
    }
}
