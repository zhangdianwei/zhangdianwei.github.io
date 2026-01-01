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
        const players = this.game.players;
        const playerCount = players.length;
        
        // 计算每个视图的宽度和位置
        const screenWidth = this.game.pixi.screen.width;
        const viewWidth = screenWidth / playerCount;

        // 为每个玩家创建视图
        for (let index = 0; index < players.length; index++) {
            const player = players[index];
            const userView = new TetrisGameUserView(this.game);
            userView.player = player; // 保存玩家信息
            
            // 设置视图位置，让它们并排显示
            const x = -screenWidth / 2 + viewWidth * index + viewWidth / 2;
            const y = 0;
            userView.position.set(x, y);
            
            // 初始化视图，传入 playerIndex
            userView.init(index);
            
            // 添加到容器
            this.addChild(userView);
            this.userViews.push(userView);
        }
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

