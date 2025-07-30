import * as PIXI from 'pixi.js';
import { GameApp } from './GameApp.js';
import Snake from './Snake.js';

export default class PlayerSnake extends Snake {
    constructor() {
        super();
        this.gameApp = GameApp.instance;
        this.speedRatio = 1;
        this.targetDirectionX = 0;
        this.targetDirectionY = 0;
        this.lastMouseX = -1;
        this.lastMouseY = -1;
        // this.setBaseSpeed(3.5);
        this.setName('YOU');
        this.isMousePressed = false;
    }

    onAdd() {
        super.onAdd();
        // 添加鼠标按下和松开事件监听
        this.gameApp.pixi.view.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.gameApp.pixi.view.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.gameApp.pixi.view.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    }

    onDestroy() {
        super.onDestroy();
        // 移除事件监听器
        this.gameApp.pixi.view.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        this.gameApp.pixi.view.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        this.gameApp.pixi.view.removeEventListener('mouseleave', this.handleMouseUp.bind(this));
    }

    handleMouseDown(event) {
        if (event.button === 0) { // 左键
            this.isMousePressed = true;
            this.speedRatio = 3; // 速度翻倍
        }
    }

    handleMouseUp(event) {
        if (event.button === 0) { // 左键
            this.isMousePressed = false;
            this.speedRatio = 1; // 恢复正常速度
        }
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
