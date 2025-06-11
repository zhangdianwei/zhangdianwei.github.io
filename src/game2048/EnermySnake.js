import Snake from './Snake.js';
import * as PIXI from 'pixi.js';

// 敌人蛇：每10秒闲逛，每10秒追踪玩家
export default class EnermySnake extends Snake {
    /**
     * @param {Array} initialCubesData
     * @param {number} baseSpeed
     * @param {object} playerSnakeInstance  // 玩家蛇实例
     */
    constructor(initialCubesData = [], baseSpeed, playerSnakeInstance) {
        super(initialCubesData, baseSpeed);
        this.playerSnakeInstance = playerSnakeInstance;
        this.state = 'wander'; // 'wander' or 'chase'
        this.stateTimer = 0;
        this.stateInterval = 10000; // 10秒
        this.wanderTarget = { x: 0, y: 0 };
        this.head.x = 100;
        this.head.y = 100;
        this.setRandomWanderTarget();
    }

    setRandomWanderTarget() {
        // 在圆形区域随机找一个点
        const radius = this.gameApp?.radius || 300;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * (radius - 60) + 30;
        this.wanderTarget.x = Math.cos(angle) * r;
        this.wanderTarget.y = Math.sin(angle) * r;
    }

    updateHeadDirectionStrategy(delta) {
        // delta单位毫秒
        this.stateTimer += delta?.deltaMS || 16;
        if (this.stateTimer >= this.stateInterval) {
            this.stateTimer = 0;
            if (this.state === 'wander') {
                this.state = 'chase';
            } else {
                this.state = 'wander';
                this.setRandomWanderTarget();
            }
        }

        if (this.state === 'chase' && this.playerSnakeInstance) {
            // 追踪玩家蛇头
            const playerHead = this.playerSnakeInstance.head;
            if (playerHead) {
                this.setHeadDirection(playerHead.x - this.head.x, playerHead.y - this.head.y);
            }
        } else if (this.state === 'wander') {
            // 闲逛，朝向wanderTarget
            this.setHeadDirection(this.wanderTarget.x - this.head.x, this.wanderTarget.y - this.head.y);
            // 如果接近目标点，重新选一个
            const dx = this.wanderTarget.x - this.head.x;
            const dy = this.wanderTarget.y - this.head.y;
            if (Math.sqrt(dx * dx + dy * dy) < 30) {
                this.setRandomWanderTarget();
            }
        }
    }
}
