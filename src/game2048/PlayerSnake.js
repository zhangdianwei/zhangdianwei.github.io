import * as PIXI from 'pixi.js';
import { GameApp } from './GameApp.js';
import Snake from './Snake.js';

export default class PlayerSnake extends Snake {
    constructor() {
        super();
        this.gameApp = GameApp.instance;
        this.speedRatio = 1;
        this.targetDirectionX = 1;
        this.targetDirectionY = 0;
        this.lastMouseX = -1;
        this.lastMouseY = -1;
        this.setName('YOU');
    }

    updateHeadDirectionStrategy() {
        const headCube = this.head;
        const globalMousePosition = this.gameApp.pixi.renderer.events.pointer.global;
        const localMouseInRoot = this.gameApp.gameContainer.toLocal(globalMousePosition);
        const headPositionInRoot = this.gameApp.gameContainer.toLocal(headCube.getGlobalPosition(new PIXI.Point(), false));
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

    onHeadValueChanged() {
        GameApp.instance.playerRank.value = this.head.value;
    }

}
