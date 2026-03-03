import * as PIXI from 'pixi.js';
import TetrisGameUserView from './TetrisGameUserView.js';

class TetrisGameView extends PIXI.Container {
    
    constructor(game) {
        super();
        this.game = game;
        this.userViews = [];
    }

    init() {
        this.initUserViews();
    }

    initUserViews() {
        const userView = new TetrisGameUserView(this.game);
        userView.position.set(0, 0);
        userView.init(0);
        this.addChild(userView);
        this.userViews.push(userView);
    }

    safeRemoveSelf() {
        // 移除所有用户视图
        for (let i = 0; i < this.userViews.length; i++) {
            const view = this.userViews[i];
            if (view && view.safeRemoveSelf) {
                view.safeRemoveSelf();
            }
        }
        this.userViews = [];
        
        // 从父容器移除
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}

export default TetrisGameView;

