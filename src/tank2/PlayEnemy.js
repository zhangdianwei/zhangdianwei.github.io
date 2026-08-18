import PlayTankBase from './PlayTankBase.js'
import { Dir, TankType } from './TileType.js'

const AI_CONFIG = {
    [TankType.ENEMY_1]: { direction: [1.5, 3], shoot: [1.4, 2.6], shootChance: 0.5 },
    [TankType.ENEMY_2]: { direction: [0.8, 1.8], shoot: [2.2, 4], shootChance: 0.4 },
    [TankType.ENEMY_3]: { direction: [1.2, 2.5], shoot: [0.8, 1.6], shootChance: 0.7 },
    [TankType.ENEMY_4]: { direction: [1.5, 3], shoot: [1.2, 2.4], shootChance: 0.6 },
};

const DIRECTION_WEIGHTS = {
    [Dir.UP]: 0.2,
    [Dir.RIGHT]: 0.2,
    [Dir.DOWN]: 0.4,
    [Dir.LEFT]: 0.2
};

export default class PlayEnemy extends PlayTankBase {
    constructor(dialog, tankType) {
        super(dialog, tankType);

        this.aiConfig = AI_CONFIG[tankType];
        this.resetDirectionTimer();
        this.resetShootDecisionTimer();
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    onAppearFinish(){
        super.onAppearFinish();
        this.setShooting(false);
        this.chooseDirectionWeighted();
        this.setMoving(true);
    }

    resetDirectionTimer() {
        this.directionTimer = this.random(...this.aiConfig.direction);
    }

    resetShootDecisionTimer() {
        this.shootDecisionTimer = this.random(...this.aiConfig.shoot);
    }

    update(deltaTime) {
        if (!this.appearAnim) this.checkAI(deltaTime);
        super.update(deltaTime);
    }

    checkAI(deltaTime) {
        this.directionTimer -= deltaTime;
        this.shootDecisionTimer -= deltaTime;

        if (this.directionTimer <= 0) {
            this.resetDirectionTimer();
            this.chooseDirectionWeighted();
        }

        this.executeMovement();

        if (this.shootDecisionTimer <= 0) {
            this.tryShoot();
            this.resetShootDecisionTimer();
        }
    }

    executeMovement() {
        const allowed = this.getAllowedDistance(this.direction);

        if (allowed <= 0) {
            this.chooseDirectionWeighted(true);
        }
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
            let w = DIRECTION_WEIGHTS[dir] ?? 0.2;
            if (dir === reverseDirection) w *= 0.5;
            if (dir === oldDirection) w *= 1.15;
            if (isBlockedReroll && dir === oldDirection) w *= 0.3;
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
        const chance = hasLineup ? Math.min(1, this.aiConfig.shootChance + 0.2) : this.aiConfig.shootChance;
        if (Math.random() < chance) {
            this.setShootOnce(true);
        }
    }

    hasFrontLineupTarget() {
        const player = this.dialog.gameView.player;
        if (this.isTargetInFrontLine(player)) return true;

        const home = this.dialog.gameView.home;
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

        const mapAllowed = this.dialog.gameView.map.getMovableDistance(selfBounds, this.direction);
        return mapAllowed >= distanceToTarget;
    }
}
