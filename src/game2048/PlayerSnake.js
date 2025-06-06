import * as PIXI from 'pixi.js';
import { GameApp } from './GameApp.js';
import Snake from './Snake.js';

export default class PlayerSnake extends Snake {
    constructor() {
        const initialLength = 1;
        const playerSpeed = 3;
        const initialCubesData = [];
        for (let i = 0; i < initialLength; i++) {
            initialCubesData.push({ value: 2 });
        }
        super(initialCubesData, playerSpeed);
        this.gameApp = GameApp.instance;
        this.speedRatio = 1;
        this.targetDirectionX = 1;
        this.targetDirectionY = 0;
        this.lastMouseX = -1;
        this.lastMouseY = -1;
    }

    updateHeadDirectionStrategy() {
        const headCube = this.head;
        const globalMousePosition = this.gameApp.pixi.renderer.events.pointer.global;
        const localMouseInRoot = this.gameApp.rootContainer.toLocal(globalMousePosition);
        const headPositionInRoot = this.gameApp.rootContainer.toLocal(headCube.getGlobalPosition(new PIXI.Point(), false));
        const mouseMovedThreshold = 1;
        if (Math.abs(localMouseInRoot.x - this.lastMouseX) > mouseMovedThreshold ||
            Math.abs(localMouseInRoot.y - this.lastMouseY) > mouseMovedThreshold ||
            this.lastMouseX === -1) {
            const dx = localMouseInRoot.x - headPositionInRoot.x;
            const dy = localMouseInRoot.y - headPositionInRoot.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0.01) {
                this.setHeadDirection(dx / len, dy / len);
            }
            this.lastMouseX = localMouseInRoot.x;
            this.lastMouseY = localMouseInRoot.y;
        }
    }

    destroy(options) {
        super.destroy(options);
    }
}
