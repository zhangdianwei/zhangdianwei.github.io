import PlayTankBase from './PlayTankBase.js'
import { Dir, TankType } from './TileType.js'

const AI_CONFIG = {
    [TankType.ENEMY_1]: { direction: [1.5, 3] },
    [TankType.ENEMY_2]: { direction: [0.8, 1.8] },
    [TankType.ENEMY_3]: { direction: [1.2, 2.5] },
    [TankType.ENEMY_4]: { direction: [1.5, 3] },
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

    update(deltaTime, frozen = false) {
        if (frozen) {
            if (this.appearAnim) super.update(deltaTime);
            else this.checkInvincible(deltaTime);
            return;
        }
        if (!this.appearAnim) this.checkAI(deltaTime);
        super.update(deltaTime);
    }

    checkAI(deltaTime) {
        this.directionTimer -= deltaTime;
        if (this.directionTimer <= 0) {
            this.resetDirectionTimer();
            this.chooseDirectionWeighted();
        }

        this.executeMovement();
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

}
