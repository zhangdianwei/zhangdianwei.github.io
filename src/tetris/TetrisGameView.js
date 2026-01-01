import * as PIXI from 'pixi.js';
import TetrisGameUserView from './TetrisGameUserView.js';

class TetrisGameView extends PIXI.Container {
    
    constructor(game) {
        super();
        this.game = game;
        this.userViews = [];
        this.masks = []; // 保存所有 mask 的引用
    }

    init() {
        this.initUserViews();
    }

    initUserViews() {
        // 清除旧的视图
        this.userViews.forEach(view => {
            if (view && view.safeRemoveSelf) {
                view.safeRemoveSelf();
            }
        });
        this.userViews = [];
        
        // 清除旧的 masks
        this.masks.forEach(mask => {
            if (mask && mask.parent) {
                mask.parent.removeChild(mask);
            }
        });
        this.masks = [];

        // 获取玩家列表，如果没有玩家则使用当前用户作为单个玩家
        const players = this.game.players.length > 0 ? this.game.players : [
            { userId: this.game.userId, isMaster: true, isRobot: false }
        ];

        const playerCount = players.length;
        
        // 计算每个视图的宽度和位置
        const screenWidth = this.game.pixi.screen.width;
        const screenHeight = this.game.pixi.screen.height;
        const viewWidth = screenWidth / playerCount;

        // 为每个玩家创建视图
        players.forEach((player, index) => {
            const userView = new TetrisGameUserView(this.game);
            userView.player = player; // 保存玩家信息
            
            // 设置视图的缩放，使每个视图只占用 1/playerCount 的屏幕宽度
            // 假设原始设计宽度是 960，需要缩放到 viewWidth
            const designWidth = 960;
            const scale = viewWidth / designWidth;
            userView.scale.set(scale, scale);
            
            // 设置视图位置，让它们并排显示
            // 由于视图已经缩放，需要调整位置计算
            const x = -screenWidth / 2 + viewWidth * index + viewWidth / 2;
            const y = 0;
            userView.position.set(x, y);
            
            // 设置裁剪区域，确保每个视图只显示在自己的区域内
            const mask = new PIXI.Graphics();
            mask.beginFill(0xFFFFFF);
            mask.drawRect(-viewWidth / 2, -screenHeight / 2, viewWidth, screenHeight);
            mask.endFill();
            mask.position.set(x, y);
            this.addChild(mask);
            userView.mask = mask;
            this.masks.push(mask); // 保存 mask 引用
            
            // 初始化视图
            userView.init();
            
            // 添加到容器（在 mask 之后添加，确保 mask 生效）
            this.addChild(userView);
            this.userViews.push(userView);
        });
    }

    safeRemoveSelf() {
        // 移除所有用户视图
        this.userViews.forEach(view => {
            if (view && view.safeRemoveSelf) {
                view.safeRemoveSelf();
            }
        });
        this.userViews = [];
        
        // 移除所有 mask
        this.masks.forEach(mask => {
            if (mask && mask.parent) {
                mask.parent.removeChild(mask);
            }
        });
        this.masks = [];
        
        // 从父容器移除
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}

export default TetrisGameView;

