import * as PIXI from 'pixi.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import { TankApp } from './TankApp.js';
import TankBase from './TankBase.js';
import { Dir, TileSize } from './TileType.js';

export default class TankEnemy extends TankBase {
    constructor(tankType) {
        super(tankType);
        
        this.aiTimer = 0;
        this.aiInterval = 2; // AI决策间隔（秒）
        this.moveTimer = 0;
        this.moveInterval = 1; // 移动间隔（秒）
        this.shootTimer = 0;
        this.shootInterval = 1.5; // 射击间隔（秒）
        
        this.currentTargetDirection = Dir.DOWN;
        this.lastDecisionTime = 0;
    }

    update(deltaTime) {
        // this.checkAI(deltaTime);
        super.update(deltaTime);
    }

    checkAI(deltaTime) {
        this.aiTimer += deltaTime;
        this.moveTimer += deltaTime;
        this.shootTimer += deltaTime;

        // AI决策
        if (this.aiTimer >= this.aiInterval) {
            this.aiTimer = 0;
            this.makeDecision();
        }

        // 移动逻辑
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.executeMovement();
        }

        // 射击逻辑
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            this.tryShoot();
        }
    }

    makeDecision() {
        const player = this.tankApp.player;
        if (!player) return;

        // 计算到玩家的距离
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 如果距离很近，优先攻击
        if (distance < TileSize * 3) {
            this.currentTargetDirection = this.getDirectionToPlayer();
            this.setShooting(true);
            return;
        }

        // 随机决策：移动、停止、改变方向
        const decision = Math.random();
        
        if (decision < 0.3) {
            // 30% 概率停止移动
            this.setMoving(false);
        } else if (decision < 0.7) {
            // 40% 概率改变方向
            this.changeDirection();
        } else {
            // 30% 概率继续移动
            this.setMoving(true);
        }
    }

    executeMovement() {
        console.log('executeMovement');
        if (!this.isMoving) return;

        // 检查前方是否有障碍
        const allowed = this.tankApp.levelData.getMovableDistance(
            this.x, this.y, this.size, this.size, this.direction
        );

        if (allowed <= 0) {
            // 前方有障碍，改变方向
            this.changeDirection();
        }
    }

    changeDirection() {
        const directions = [Dir.UP, Dir.RIGHT, Dir.DOWN, Dir.LEFT];
        const availableDirections = [];

        // 检查每个方向是否可通行
        for (const dir of directions) {
            const allowed = this.tankApp.levelData.getMovableDistance(
                this.x, this.y, this.size, this.size, dir
            );
            if (allowed > TileSize / 2) {
                availableDirections.push(dir);
            }
        }

        // 如果有可通行的方向，随机选择一个
        if (availableDirections.length > 0) {
            const randomDir = availableDirections[Math.floor(Math.random() * availableDirections.length)];
            this.setDirection(randomDir);
            this.setMoving(true);
        } else {
            // 没有可通行的方向，停止移动
            this.setMoving(false);
        }
    }

    getDirectionToPlayer() {
        const player = this.tankApp.player;
        if (!player) return Dir.DOWN;

        const dx = player.x - this.x;
        const dy = player.y - this.y;

        // 优先选择距离更近的轴
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? Dir.RIGHT : Dir.LEFT;
        } else {
            return dy > 0 ? Dir.DOWN : Dir.UP;
        }
    }

    tryShoot() {
        const player = this.tankApp.player;
        if (!player) return;

        // 检查是否朝向玩家
        const directionToPlayer = this.getDirectionToPlayer();
        if (this.direction === directionToPlayer) {
            this.setShooting(true);
        }
    }

    destroy() {
        super.destroy();
        this.tankApp.logic.removeEnemy(this);
    }
} 