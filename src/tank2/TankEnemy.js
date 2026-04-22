import TankBase from './TankBase.js';
import { Dir } from './TileType.js';

const ENEMY_AI_CONFIG = {
    // 换向决策间隔（秒）：越小越频繁换方向
    directionIntervalMin: 6,
    directionIntervalMax: 10,
    // 射击决策间隔（秒）：到点后按概率判断是否开火
    shootIntervalMin: 4,
    shootIntervalMax: 8,
    // 与当前方向相反方向的权重惩罚（<1表示不爱掉头）
    reversePenalty: 0.5,
    // 维持当前方向的轻微加权（>1表示更容易保持方向）
    keepDirectionBoost: 1.15,
    // 遇阻重选时，对“继续原方向”的额外惩罚
    blockedKeepDirectionPenalty: 0.3,
    // 常态开火概率
    baseShootChance: 0.5,
    // 前方同轴看到目标时的开火概率
    lineupShootChance: 0.65,
    // 方向基础权重（下方权重更高，营造压家感）
    directionWeights: {
        [Dir.UP]: 0.2,
        [Dir.RIGHT]: 0.2,
        [Dir.DOWN]: 0.4,
        [Dir.LEFT]: 0.2
    }
};

export default class TankEnemy extends TankBase {
    constructor(tankType) {
        super(tankType);

        this.directionTimer = this.random(ENEMY_AI_CONFIG.directionIntervalMin, ENEMY_AI_CONFIG.directionIntervalMax);
        this.resetShootTimer();

        this.reversePenalty = ENEMY_AI_CONFIG.reversePenalty;
        this.baseShootChance = ENEMY_AI_CONFIG.baseShootChance;
        this.lineupShootChance = ENEMY_AI_CONFIG.lineupShootChance;
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    onAppearFinish(){
        super.onAppearFinish();
        this.setMoving(true);
        this.setShooting(false);
        this.chooseDirectionWeighted();
    }

    resetShootTimer() {
        this.shootTimer = this.random(ENEMY_AI_CONFIG.shootIntervalMin, ENEMY_AI_CONFIG.shootIntervalMax);
    }

    update(deltaTime) {
        this.checkAI(deltaTime);
        super.update(deltaTime);
    }

    checkAI(deltaTime) {
        this.directionTimer -= deltaTime;
        this.shootTimer -= deltaTime;

        if (this.directionTimer <= 0) {
            this.directionTimer = this.random(ENEMY_AI_CONFIG.directionIntervalMin, ENEMY_AI_CONFIG.directionIntervalMax);
            this.chooseDirectionWeighted();
        }

        this.executeMovement();

        if (this.shootTimer <= 0) {
            this.tryShoot();
            this.resetShootTimer();
        }
    }

    executeMovement() {
        const allowed = this.getAllowedDistance(this.direction);

        if (allowed <= 0) {
            // 遇阻立刻重选方向，避免顶墙发呆
            this.chooseDirectionWeighted(true);
        }
    }

    getAllowedDistance(dir) {
        const allowedMap = this.tankApp.ui.map.getMovableDistance(this.getBounds(), dir);
        const allowedTank = this.tankApp.ui.getMovableDistance(this.getBounds(), dir, this);
        return Math.min(allowedMap, allowedTank);
    }

    chooseDirectionWeighted(isBlockedReroll = false) {
        const oldDirection = this.direction;
        const reverseDirection = (oldDirection + 2) % 4;
        const directions = [Dir.UP, Dir.RIGHT, Dir.DOWN, Dir.LEFT];
        const candidates = [];

        for (const dir of directions) {
            const allowed = this.getAllowedDistance(dir);
            if (allowed > 0) {
                candidates.push(dir);
            }
        }
        if (candidates.length === 0) return;

        let totalWeight = 0;
        const weighted = candidates.map((dir) => {
            let w = ENEMY_AI_CONFIG.directionWeights[dir] ?? 0.2;
            if (dir === reverseDirection) w *= this.reversePenalty;
            if (dir === oldDirection) w *= ENEMY_AI_CONFIG.keepDirectionBoost;
            if (isBlockedReroll && dir === oldDirection) w *= ENEMY_AI_CONFIG.blockedKeepDirectionPenalty;
            totalWeight += w;
            return { dir, w };
        });

        if (totalWeight <= 0) {
            const fallback = candidates[Math.floor(Math.random() * candidates.length)];
            this.setDirection(fallback);
            return;
        }

        let r = Math.random() * totalWeight;
        for (const item of weighted) {
            r -= item.w;
            if (r <= 0) {
                this.setDirection(item.dir);
                return;
            }
        }
        this.setDirection(weighted[weighted.length - 1].dir);
    }

    tryShoot() {
        const hasLineup = this.hasFrontLineupTarget();
        const chance = hasLineup ? this.lineupShootChance : this.baseShootChance;
        if (Math.random() < chance) {
            this.setShootOnce(true);
        }
    }

    hasFrontLineupTarget() {
        const player = this.tankApp.ui.player;
        if (this.isTargetInFrontLine(player)) return true;

        const home = this.tankApp.ui.home;
        if (this.isTargetInFrontLine(home)) return true;

        return false;
    }

    isTargetInFrontLine(target) {
        if (!target || target.isDead) return false;
        const targetBounds = target.getBounds();
        const selfBounds = this.getBounds();

        const selfHalfW = selfBounds.width / 2;
        const selfHalfH = selfBounds.height / 2;
        const targetHalfW = targetBounds.width / 2;
        const targetHalfH = targetBounds.height / 2;

        let distanceToTarget = -1;

        if (this.direction === Dir.UP) {
            const inLane = Math.abs(targetBounds.x - selfBounds.x) <= (selfHalfW + targetHalfW) / 2;
            if (!inLane) return false;
            distanceToTarget = (selfBounds.y - selfHalfH) - (targetBounds.y + targetHalfH);
        } else if (this.direction === Dir.RIGHT) {
            const inLane = Math.abs(targetBounds.y - selfBounds.y) <= (selfHalfH + targetHalfH) / 2;
            if (!inLane) return false;
            distanceToTarget = (targetBounds.x - targetHalfW) - (selfBounds.x + selfHalfW);
        } else if (this.direction === Dir.DOWN) {
            const inLane = Math.abs(targetBounds.x - selfBounds.x) <= (selfHalfW + targetHalfW) / 2;
            if (!inLane) return false;
            distanceToTarget = (targetBounds.y - targetHalfH) - (selfBounds.y + selfHalfH);
        } else if (this.direction === Dir.LEFT) {
            const inLane = Math.abs(targetBounds.y - selfBounds.y) <= (selfHalfH + targetHalfH) / 2;
            if (!inLane) return false;
            distanceToTarget = (selfBounds.x - selfHalfW) - (targetBounds.x + targetHalfW);
        }

        if (distanceToTarget < 0) return false;

        const mapAllowed = this.tankApp.ui.map.getMovableDistance(selfBounds, this.direction);
        return mapAllowed >= distanceToTarget;
    }
} 