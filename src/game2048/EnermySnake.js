import { GameApp } from './GameApp.js';
import Snake from './Snake.js';

// 敌人蛇：每10秒闲逛，每10秒追踪玩家
export default class EnermySnake extends Snake {

    constructor() {
        super();
        this.state = 'wander'; // 'wander' or 'chase'
        this.stateTimer = 0;
        this.stateInterval = 8000; // 10秒
        this.wanderTarget = { x: 0, y: 0 };
        this.setRandomWanderTarget();
        this.setName(GameApp.instance.randomName());
    }

    get playerSnakeInstance(){
        return GameApp.instance.playerSnake;
    }

    setRandomWanderTarget() {
        // 在圆形区域随机找一个点，且保证目标点不会超出边界
        const radius = GameApp.instance.radius;
        const safeMargin = 30;
        const maxR = radius - safeMargin;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * maxR;
        this.wanderTarget.x = Math.cos(angle) * r;
        this.wanderTarget.y = Math.sin(angle) * r;
    }

    onHeadValueChanged() {
        GameApp.instance.updateRankList(this.name, this.head.value);
    }

    updateHeadDirectionStrategy(delta) {
        // delta单位毫秒
        this.stateTimer += delta?.deltaMS || 16;
        if (this.stateTimer >= this.stateInterval) {
            this.stateTimer = 0;
            // 只有比玩家大才追逐，否则只闲逛
            const playerHead = this.playerSnakeInstance?.head;
            if (this.state === 'wander') {
                if (playerHead && this.head.value > playerHead.value) {
                    this.state = 'chase';
                } else {
                    this.state = 'wander';
                    this.setRandomWanderTarget();
                }
            } else {
                this.state = 'wander';
                this.setRandomWanderTarget();
            }
        }

        const playerHead = this.playerSnakeInstance?.head;
        if (this.state === 'chase' && playerHead && this.head.value > playerHead.value) {
            // 追踪玩家蛇头
            this.setHeadDirection(playerHead.x - this.head.x, playerHead.y - this.head.y);
        } else {
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
