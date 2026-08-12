import * as PIXI from 'pixi.js'
import Cube from './PlayCube.js'

function shortestAngleDist(a0, a1) {
    const max = Math.PI * 2
    const da = (a1 - a0) % max
    return ((2 * da) % max) - da
}

function normalizeAnglePi(angle) {
    angle = angle % (Math.PI * 2)
    if (angle > Math.PI) {
        angle -= Math.PI * 2
    }
    if (angle < -Math.PI) {
        angle += Math.PI * 2
    }
    return angle
}

export default class Snake extends PIXI.Container {
    constructor(playMgr) {
        super()

        this.playMgr = playMgr
        this.cubes = []
        this.setBaseSpeed(3)
        this.speedRatio = 1
        this.turnRate = 0.1
        this.collisionCooldown = 0
        this.mergeEffect = null
        this.mergeCooldown = 0

        // 初始化方向属性，避免未定义错误
        this.targetDirectionX = 1
        this.targetDirectionY = 0

        // Debug功能：目标点绘制
        this.debugMode = false
        this.debugGraphics = null

        // this.toggleDebug();
    }

    setBaseSpeed(speed) {
        this.baseSpeed = speed
    }

    get head() {
        return this.cubes[0]
    }

    setPosition(x, y) {
        this.head.x = x
        this.head.y = y
    }

    getIdealGap(leader, follower) {
        return (leader.getSize() + follower.getSize()) * 0.35
    }

    setName(name) {
        this.name = name
        this.updateName()
    }

    updateName() {
        if (!this.head) return
        if (!this.nameTxt) {
            this.nameTxt = new PIXI.Text(this.name || '', {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 20,
                fill: 0xffff66, // 亮黄色
                stroke: 0x222222, // 深色描边
                strokeThickness: 5,
                align: 'center',
            })
            this.nameTxt.anchor.set(0.5, 1)
            this.head.addChild(this.nameTxt)

            this.nameTxt.x = 0
            this.nameTxt.y = 0
            this.nameTxt.rotation = Math.PI / 2 // 保持正向朝上
            this.nameTxt.visible = !!this.name
        }
        if (this.nameTxt.parent !== this.head) this.head.addChild(this.nameTxt)
        this.nameTxt.text = this.name || ''
    }

    addCubes(levels) {
        levels.forEach((level) => {
            this.addCube(level)
        })
    }

    addCube(level) {
        let x = 0,
            y = 0,
            rotation = 0
        let idx = this.cubes.length
        while (idx > 0 && this.cubes[idx - 1].level < level) {
            idx--
        }
        const newCube = new Cube(this.playMgr.app.textures.ship, level, 0, 0)
        if (this.cubes.length > 0) {
            let prev = idx > 0 ? this.cubes[idx - 1] : null
            let next = this.cubes[idx] || null
            if (prev) {
                newCube.entryProgress = 0
                newCube.alpha = 0.35
                x = prev.x
                y = prev.y
                rotation = prev.rotation
            } else if (next) {
                next.entryProgress = 0
                next.alpha = 0.35
                x = next.x
                y = next.y
                rotation = next.rotation
            }
        }
        newCube.x = x
        newCube.y = y
        newCube.rotation = rotation
        newCube.setSnake(this)

        this.cubes.splice(idx, 0, newCube)
        this.addChild(newCube)
        this.updateCubeZOrder()
        this.onHeadValueChanged()
        this.updateName()
        return newCube
    }

    onHeadValueChanged() {}

    update(delta) {
        const dt = delta?.deltaMS || 16
        this.collisionCooldown = Math.max(0, this.collisionCooldown - dt)
        this.updateNormalMovement(delta)
        this.updateMergeEffect(dt)
        if (this.mergeCooldown > 0) {
            this.mergeCooldown = Math.max(0, this.mergeCooldown - dt)
        } else {
            this.mergeCubesIfPossible()
        }
    }

    updateHeadDirectionStrategy(delta) {}

    get finalSpeed() {
        return this.baseSpeed * this.speedRatio
    }

    setHeadDirection(x, y) {
        // 归一化向量，避免速度异常
        const len = Math.sqrt(x * x + y * y)
        if (len > 0.00001) {
            this.targetDirectionX = x / len
            this.targetDirectionY = y / len
        } else {
            this.targetDirectionX = 1
            this.targetDirectionY = 0
        }
    }

    updateHeadMovement(deltaTime) {
        const headCube = this.head

        // 添加安全检查，确保方向属性存在
        if (
            typeof this.targetDirectionX !== 'number' ||
            typeof this.targetDirectionY !== 'number'
        ) {
            this.targetDirectionX = 1
            this.targetDirectionY = 0
        }

        const maxRadius = this.playMgr.radius - headCube.getSize() / 2
        const targetAngle = Math.atan2(this.targetDirectionY, this.targetDirectionX)
        const currentRotation = normalizeAnglePi(headCube.rotation)
        const angleDifference = shortestAngleDist(currentRotation, targetAngle)
        const rotationLerpFactor = this.speedRatio > 1 ? this.turnRate * 0.55 : this.turnRate

        headCube.rotation += angleDifference * rotationLerpFactor * deltaTime
        headCube.rotation = normalizeAnglePi(headCube.rotation)

        headCube.x += Math.cos(headCube.rotation) * this.finalSpeed * deltaTime
        headCube.y += Math.sin(headCube.rotation) * this.finalSpeed * deltaTime

        // 不要超出圆形区域
        if (this.playMgr) {
            const distToCenter = Math.hypot(headCube.x, headCube.y)
            if (distToCenter > maxRadius) {
                const clampAngle = Math.atan2(headCube.y, headCube.x)
                headCube.x = Math.cos(clampAngle) * maxRadius
                headCube.y = Math.sin(clampAngle) * maxRadius
            }
        }
    }

    updateNormalMovement(delta) {
        const deltaTime = delta && delta.deltaTime ? delta.deltaTime : 1

        this.updateHeadDirectionStrategy(delta)

        this.updateHeadMovement(deltaTime)

        this.updateSnakeLogic(deltaTime, delta?.deltaMS || 16)
    }

    mergeCubesIfPossible() {
        if (this.mergeEffect) return
        if (this.cubes.length < 2) return
        for (let i = 0; i < this.cubes.length - 1; i++) {
            const cubeA = this.cubes[i]
            const cubeB = this.cubes[i + 1]
            if (cubeA.level === cubeB.level) {
                this.startMerge(i)
                break
            }
        }
    }

    startMerge(index) {
        const target = this.cubes[index]
        const ghost = this.cubes[index + 1]
        this.cubes.splice(index + 1, 1)
        target.setLevel(target.level + 1)
        if (index === 0) this.onHeadValueChanged()
        if (this === this.playMgr.playerSnake) this.playMgr.rewardBoost(8)
        this.mergeEffect = {
            target,
            ghost,
            targetScale: target.shipSprite.scale.x,
            offsetX: ghost.x - target.x,
            offsetY: ghost.y - target.y,
            offsetRotation: shortestAngleDist(target.rotation, ghost.rotation),
            elapsed: 0,
            duration: 180,
        }
        this.mergeCooldown = 180
        this.updateCubeZOrder()
    }

    updateMergeEffect(dt) {
        const effect = this.mergeEffect
        if (!effect) return
        if (!effect.target.parent || !effect.ghost.parent) {
            this.clearMergeEffect()
            return
        }
        effect.elapsed += dt
        const progress = Math.min(1, effect.elapsed / effect.duration)
        const offsetRatio = (1 - progress) ** 3
        effect.ghost.x = effect.target.x + effect.offsetX * offsetRatio
        effect.ghost.y = effect.target.y + effect.offsetY * offsetRatio
        effect.ghost.rotation = effect.target.rotation + effect.offsetRotation * offsetRatio
        effect.ghost.alpha = 1 - progress
        effect.ghost.scale.set(1 - progress * 0.35)
        effect.target.shipSprite.scale.set(
            effect.targetScale * (1 + Math.sin(progress * Math.PI) * 0.12),
        )
        if (progress >= 1) this.clearMergeEffect()
    }

    clearMergeEffect() {
        const effect = this.mergeEffect
        const ghost = effect?.ghost
        this.mergeEffect = null
        if (effect?.target && !effect.target.destroyed) {
            effect.target.shipSprite.scale.set(effect.targetScale)
        }
        if (ghost && !ghost.destroyed) {
            ghost.removeFromParent()
            ghost.destroy({ children: true })
        }
    }

    updateSnakeLogic(deltaTime, dt) {
        if (this.cubes.length < 2) return

        // 清除之前的debug图形
        if (this.debugMode) {
            this.debugGraphics.clear()
        }

        // 从第二个cube开始，每个cube追逐前面的cube
        for (let i = 1; i < this.cubes.length; i++) {
            const follower = this.cubes[i] // 当前cube（跟随者）
            const leader = this.cubes[i - 1] // 前面的cube（领导者）
            if (follower.entryProgress < 1) {
                follower.entryProgress = Math.min(1, follower.entryProgress + dt / 180)
                follower.alpha = 0.35 + follower.entryProgress * 0.65
            }

            const idealGap = this.getIdealGap(leader, follower) * follower.entryProgress

            // 计算目标位置（在leader后方idealGap距离处）
            const targetX = leader.x - Math.cos(leader.rotation) * idealGap
            const targetY = leader.y - Math.sin(leader.rotation) * idealGap

            // Debug绘制：目标点和连线
            if (this.debugMode) {
                // 绘制目标点（红色）
                this.drawTargetPoint(targetX, targetY, 0xff0000)
                // 绘制从follower到目标点的连线（绿色）
                this.drawLine(follower.x, follower.y, targetX, targetY, 0x00ff00)
                // 绘制从leader到目标点的连线（蓝色）
                this.drawLine(leader.x, leader.y, targetX, targetY, 0x0000ff)
            }

            const followSpeed = this.finalSpeed * follower.speedRatio * 3
            const dx = targetX - follower.x
            const dy = targetY - follower.y
            const distance = Math.hypot(dx, dy)
            const positionRatio = 1 - Math.exp(-dt / 48)
            const moveDist = Math.min(distance * positionRatio, followSpeed * deltaTime)
            if (distance > 0.001) {
                follower.x += dx / distance * moveDist
                follower.y += dy / distance * moveDist
            }
            const targetAngle = distance > 0.5 ? Math.atan2(dy, dx) : leader.rotation
            const rotationRatio = 1 - Math.exp(-dt / 140)
            follower.rotation = normalizeAnglePi(
                follower.rotation +
                    shortestAngleDist(follower.rotation, targetAngle) * rotationRatio,
            )
        }
    }

    updateCubeZOrder() {
        if (this.mergeEffect?.ghost?.parent === this) {
            this.setChildIndex(this.mergeEffect.ghost, this.children.length - 1)
        }
        for (let i = 0; i < this.cubes.length; i++) {
            this.setChildIndex(this.cubes[i], this.cubes.length - 1 - i)
        }
    }

    splitAt(index) {
        this.clearMergeEffect()
        const removed = this.cubes.slice(index)
        if (index === 0 && this.nameTxt) {
            this.nameTxt.destroy()
            this.nameTxt = null
        }
        this.cubes.splice(index)
        for (const cube of removed) {
            cube.setSnake(null)
            this.playMgr.addLooseCube(cube)
        }
        if (index === 0) {
            this.onRemoved()
            this.playMgr.removeObject(this)
        }
    }

    onRemoved() {}

    bounceFrom(cube) {
        const dx = this.head.x - cube.x
        const dy = this.head.y - cube.y
        const length = Math.hypot(dx, dy) || 1
        this.setHeadDirection(dx / length, dy / length)
        this.head.rotation = Math.atan2(dy, dx)
        this.head.x += (dx / length) * 18
        this.head.y += (dy / length) * 18
        this.collisionCooldown = 500
    }

    /**
     * 切换debug模式
     */
    toggleDebug() {
        this.debugMode = !this.debugMode
        if (this.debugMode) {
            this.initDebugGraphics()
        } else {
            this.clearDebugGraphics()
        }
    }

    /**
     * 初始化debug图形
     */
    initDebugGraphics() {
        if (!this.debugGraphics) {
            this.debugGraphics = new PIXI.Graphics()
            this.addChild(this.debugGraphics)
        }
    }

    /**
     * 清除debug图形
     */
    clearDebugGraphics() {
        if (this.debugGraphics) {
            this.debugGraphics.clear()
        }
    }

    /**
     * 绘制目标点
     */
    drawTargetPoint(x, y, color = 0xff0000) {
        if (!this.debugMode || !this.debugGraphics) return

        this.debugGraphics.beginFill(color)
        this.debugGraphics.drawCircle(x, y, 5)
        this.debugGraphics.endFill()
    }

    /**
     * 绘制连线
     */
    drawLine(fromX, fromY, toX, toY, color = 0x00ff00) {
        if (!this.debugMode || !this.debugGraphics) return

        this.debugGraphics.lineStyle(2, color)
        this.debugGraphics.moveTo(fromX, fromY)
        this.debugGraphics.lineTo(toX, toY)
    }
}
