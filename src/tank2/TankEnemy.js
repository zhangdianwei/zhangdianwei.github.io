import * as PIXI from 'pixi.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import { TankApp } from './TankApp.js';
import TankBase from './TankBase.js';
import { Dir, TileSize } from './TileType.js';

export default class TankEnemy extends TankBase {
    constructor(tankType) {
        super(tankType);
        
        this.aiTimer = 0; // AI决策间隔（秒）
        this.moveTimer = 0; // 移动间隔（秒）
        this.resetShootTimer();
        
        // AI状态
        this.aiState = ''; // 'random', 'huntHome'
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    onAppearFinish(){
        super.onAppearFinish();
        this.checkAI(0);
        this.setMoving(true);
    }

    resetShootTimer(mode = 'normal') {
        if (mode === 'fast') {
            this.shootTimer = this.random(1, 3); // 快速射击模式
        } else {
            this.shootTimer = this.random(1, 3); // 正常射击模式
        }
    }

    update(deltaTime) {
        this.checkAI(deltaTime);
        super.update(deltaTime);
    }

    checkAI(deltaTime) {
        this.aiTimer -= deltaTime;
        this.moveTimer -= deltaTime;
        this.shootTimer -= deltaTime;

        // AI决策
        if (this.aiTimer <= 0) {
            this.aiTimer = 2;
            this.makeDecision();
        }

        // 移动逻辑
        if (this.moveTimer <= 0) {
            this.moveTimer = 1;
            this.executeMovement();
        }

        // 射击逻辑
        if (this.shootTimer <= 0) {
            this.resetShootTimer();
            this.setShootOnce(true); // 直接射击
        }
    }

    makeDecision() {
        const decision = Math.random();
        const oldState = this.aiState;
        
        // 50% 概率进入随机游动状态
        if (decision < 1) {
            this.aiState = 'random';
            this.randomWander(oldState !== 'random');
            // 退出huntHome状态时重置射击间隔
            if (oldState === 'huntHome') {
                this.resetShootTimer('normal');
            }
        }
        // 50% 概率进入猎杀基地状态
        else {
            this.aiState = 'huntHome';
            this.huntHome(oldState !== 'huntHome');
        }
    }

    randomWander(isFirstEnter) {
        if (isFirstEnter) {
            // 首次进入随机游动状态：立即改变方向
            this.changeDirection();
        } else {
            // 刷新状态：随机改变方向
            if (Math.random() < 0.3) { // 30% 概率改变方向
                this.changeDirection();
            }
        }
    }

    huntHome(isFirstEnter) {
        if (isFirstEnter) {
            // 首次进入猎杀基地状态：设置快速射击
            this.resetShootTimer('fast');
        }
        
        const targetRow = 25;
        const currentRow = Math.round(this.y / TileSize);
        
        if (currentRow < targetRow) {
            // 还没到第25行，向下移动
            this.setDirection(Dir.DOWN);
        } else if (currentRow > targetRow) {
            // 超过第25行，向上移动
            this.setDirection(Dir.UP);
        } else {
            // 已经在第25行，左右移动
            if (Math.random() < 0.3) { // 30%概率改变方向
                const horizontalDirs = [Dir.LEFT, Dir.RIGHT];
                const randomDir = horizontalDirs[Math.floor(Math.random() * horizontalDirs.length)];
                this.setDirection(randomDir);
            }
        }
    }

    executeMovement() {
        // 坦克永远移动，检查前方是否有障碍
        const allowed = this.tankApp.ui.map.getMovableDistance(
            this.getBounds(), this.direction
        );

        if (allowed <= 0) {
            // 前方有障碍，改变方向
            this.changeDirection();
        }
    }

    changeDirection() {
        const oldDirection = this.direction;
        const directions = [Dir.UP, Dir.RIGHT, Dir.DOWN, Dir.LEFT];
        const availableDirections = [];

        // 先找出所有可移动方向
        for (const dir of directions) {
            const allowed = this.tankApp.ui.map.getMovableDistance(
                this.getBounds(), dir
            );
            const allowed2 = this.tankApp.ui.getMovableDistance(
                this.getBounds(), dir, this
            );
            const minAllowed = Math.min(allowed, allowed2);
            if (minAllowed > TileSize / 2) {
                availableDirections.push(dir);
            }
        }

        if (availableDirections.length === 0) return; // 没有可移动方向

        const strategy = Math.random();
        let targetDirection;

        // 10% 概率向下
        if (strategy < 0.1) {
            targetDirection = Dir.DOWN;
        }
        // 40% 概率维持方向
        else if (strategy < 0.5) {
            targetDirection = oldDirection;
        }
        // 40% 概率侧面转向
        else if (strategy < 0.9) {
            // 随机选择左右两个侧面方向
            const sideDirections = [(oldDirection + 1) % 4, (oldDirection + 3) % 4];
            targetDirection = sideDirections[Math.floor(Math.random() * sideDirections.length)];
        }
        // 10% 概率反向走
        else {
            targetDirection = (oldDirection + 2) % 4; // 相反方向
        }

        // 检查目标方向是否在可移动方向中
        if (availableDirections.includes(targetDirection)) {
            // 目标方向可通行，直接使用
            this.setDirection(targetDirection);
        } else {
            // 目标方向不可通行，从可移动方向中随机选择一个
            const randomDir = availableDirections[Math.floor(Math.random() * availableDirections.length)];
            this.setDirection(randomDir);
        }
    }

    getDirectionToHome() {
        const home = this.tankApp.ui.home;
        if (!home) return Dir.DOWN;

        const dx = home.x - this.x;
        const dy = home.y - this.y;

        // 优先选择距离更近的轴
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? Dir.RIGHT : Dir.LEFT;
        } else {
            return dy > 0 ? Dir.DOWN : Dir.UP;
        }
    }

    destroy() {
        super.destroy();
        this.tankApp.removeEnemy(this);
    }
} 