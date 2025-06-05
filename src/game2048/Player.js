// src/game2048/Player.js
import * as PIXI from 'pixi.js';
import { GameApp } from './GameApp.js';

export default class Player extends PIXI.Sprite {
    constructor() {
        // 假设 ship_E.png 位于 public/shooter/ 目录下
        const texture = PIXI.Texture.from('shooter/ship_E.png');
        super(texture);

        this.anchor.set(0.5); // 中心点对齐

        // 玩家的移动速度，可以根据需要调整
        this.speed = 5; // 用于平滑移动，如果直接跟随鼠标则不需要

        // 初始化时将其放置在中心（相对于其父容器，即 rootContainer）
        this.x = 0;
        this.y = 0;
    }

    update(delta) {
        const gameApp = GameApp.instance;
        if (!gameApp || !gameApp.pixi || !gameApp.rootContainer) {
            return;
        }

        // 获取鼠标在 Pixi 全局空间的坐标
        // Get the global mouse/pointer position using the new EventSystem
        const mousePosition = gameApp.pixi.renderer.events.pointer.global;

        // 将全局鼠标坐标转换到 rootContainer 的本地坐标系
        // rootContainer 是 Player 的直接或间接父容器，并且其 (0,0) 点是圆心
        const localMousePosition = gameApp.rootContainer.toLocal(mousePosition);

        // 1. 计算朝向鼠标的角度
        const dx = localMousePosition.x - this.x;
        const dy = localMousePosition.y - this.y;

        if (dy !== 0 || dx !== 0) {
            this.rotation = Math.atan2(dy, dx);
        }


        // 2. 计算玩家朝向鼠标的意图移动位置
        const targetX = localMousePosition.x;
        const targetY = localMousePosition.y;

        const moveDx = targetX - this.x;
        const moveDy = targetY - this.y;
        const distanceToTarget = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
        const deltaTime = delta.deltaTime || 1; // 从之前的逻辑获取

        let nextPlayerX = this.x;
        let nextPlayerY = this.y;

        // 根据距离决定是平滑移动还是直接到达目标点 (基于用户之前的设定 distanceToTarget > 10)
        if (distanceToTarget > 10) { // 平滑移动
            nextPlayerX += (moveDx / distanceToTarget) * this.speed * deltaTime;
            nextPlayerY += (moveDy / distanceToTarget) * this.speed * deltaTime;
        } else if (distanceToTarget > 0) { // 足够近，直接设置为目标点
            nextPlayerX = targetX;
            nextPlayerY = targetY;
        }

        // 3. 限制玩家计算出的下一个位置在圆形区域内
        const maxRadius = gameApp.radius; // 使用用户之前的设定
        const distanceFromNextPosToCenter = Math.sqrt(nextPlayerX * nextPlayerX + nextPlayerY * nextPlayerY);

        if (distanceFromNextPosToCenter > maxRadius) {
            // 如果计算出的下一个位置超出了边界，则将其限制在边界上
            const angleToNextPos = Math.atan2(nextPlayerY, nextPlayerX);
            this.x = Math.cos(angleToNextPos) * maxRadius;
            this.y = Math.sin(angleToNextPos) * maxRadius;
        } else {
            // 下一个位置在边界内，正常更新玩家位置
            this.x = nextPlayerX;
            this.y = nextPlayerY;
        }
    }

    destroy(options) {
        // 可以在这里添加额外的销毁逻辑，比如从 ticker 中移除 update
        super.destroy(options);
    }
}
