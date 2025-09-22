import { TankApp } from './TankApp.js';

export default class TankCompInput {
    constructor(gameUI) {
        this.gameUI = gameUI;
        this.tankApp = TankApp.instance;
        this.keys = {};
        this.moveKeys = [];
        this.lastShootTime = 0;
        this.shootCooldown = 0.3;
        this._onKeyDown = null;
        this._onKeyUp = null;
        this.setupInput();
    }

    setupInput() {
        if (!this._onKeyDown) {
            this._onKeyDown = (e) => {
                this.keys[e.code] = true;
                this.keyDown(e.code);
            };
        }
        if (!this._onKeyUp) {
            this._onKeyUp = (e) => {
                this.keys[e.code] = false;
                this.keyUp(e.code);
            };
        }
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    keyDown(keyCode) {
        const player = this.gameUI.player;
        if (!player) return;
        
        switch (keyCode) {
            case 'ArrowUp':
            case 'KeyW':
            case 'ArrowRight':
            case 'KeyD':
            case 'ArrowDown':
            case 'KeyS':
            case 'ArrowLeft':
            case 'KeyA':
                this.addMoveKey(keyCode);
                break;
            case 'Space':
                player.setShooting(true);
                break;
        }
    }

    keyUp(keyCode) {
        const player = this.gameUI.player;
        if (!player) return;
        
        switch (keyCode) {
            case 'ArrowUp':
            case 'KeyW':
            case 'ArrowRight':
            case 'KeyD':
            case 'ArrowDown':
            case 'KeyS':
            case 'ArrowLeft':
            case 'KeyA':
                this.removeMoveKey(keyCode);
                break;
            case 'Space':
                player.setShooting(false);
                break;
        }
    }

    addMoveKey(keyCode) {
        if (this.moveKeys.includes(keyCode)) return;
        this.moveKeys.push(keyCode);
        this.checkMovePlayer();
    }
    removeMoveKey(keyCode) {
        let index = this.moveKeys.indexOf(keyCode);
        if (index === -1) return;
        this.moveKeys.splice(index, 1);
        this.checkMovePlayer();
    }

    checkMovePlayer() {
        const player = this.gameUI.player;

        const last = this.moveKeys[this.moveKeys.length - 1];
        if (!last){
            player.setMoving(false);
        }
        else if (last === 'ArrowUp' || last === 'KeyW'){
            player.setDirection(0);
            player.setMoving(true);
        }
        else if (last === 'ArrowRight' || last === 'KeyD'){
            player.setDirection(1);
            player.setMoving(true);
        }
        else if (last === 'ArrowDown' || last === 'KeyS'){
            player.setDirection(2);
            player.setMoving(true);
        }
        else if (last === 'ArrowLeft' || last === 'KeyA'){
            player.setDirection(3);
            player.setMoving(true);
        }
    }

    makeDead() {
        if (this._onKeyDown) {
            window.removeEventListener('keydown', this._onKeyDown);
            this._onKeyDown = null;
        }
        if (this._onKeyUp) {
            window.removeEventListener('keyup', this._onKeyUp);
            this._onKeyUp = null;
        }
    }
}