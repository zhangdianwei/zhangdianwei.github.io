import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import TetrisGameUserView from './TetrisGameUserView.js';

class TetrisGameView extends PIXI.Container {
    
    constructor(game) {
        super();
        this.game = game;
        this.userViews = [];
        this.centerIndex = 0; // 当前中间显示的视图索引
    }

    init() {
        this.initUserViews();
        this.initArrows();
        this.updateViewsLayout();
    }

    initUserViews() {
        const players = this.game.players;

        // 为每个玩家创建视图
        for (let index = 0; index < players.length; index++) {
            const player = players[index];
            const userView = new TetrisGameUserView(this.game);
            userView.player = player; // 保存玩家信息
            
            // 所有视图都放在中心位置，通过布局更新来调整
            userView.position.set(0, 0);
            
            // 初始化视图，传入 playerIndex
            userView.init(index);
            
            // 添加到容器
            this.addChild(userView);
            this.userViews.push(userView);
        }
    }

    initArrows() {
        const screenWidth = this.game.pixi.screen.width;
        const arrowSize = 60;
        
        // 左箭头
        const leftArrowTexture = this.game.textures['tetris/arrow.png'];
        if (leftArrowTexture) {
            this.leftArrow = new PIXI.Sprite(leftArrowTexture);
            this.leftArrow.anchor.set(0.5, 0.5);
            this.leftArrow.position.set(-screenWidth / 2 + arrowSize, 0);
            this.leftArrow.scale.x = -1; // 翻转箭头方向
            this.leftArrow.eventMode = 'static';
            this.leftArrow.on('pointerdown', () => {
                this.switchView(-1);
            });
            this.addChild(this.leftArrow);
        }

        // 右箭头
        const rightArrowTexture = this.game.textures['tetris/arrow.png'];
        if (rightArrowTexture) {
            this.rightArrow = new PIXI.Sprite(rightArrowTexture);
            this.rightArrow.anchor.set(0.5, 0.5);
            this.rightArrow.position.set(screenWidth / 2 - arrowSize, 0);
            this.rightArrow.eventMode = 'static';
            this.rightArrow.on('pointerdown', () => {
                this.switchView(1);
            });
            this.addChild(this.rightArrow);
        }

        this.updateArrowsVisibility();
    }

    switchView(direction) {
        const newCenterIndex = this.centerIndex + direction;
        if (newCenterIndex >= 0 && newCenterIndex < this.userViews.length) {
            this.centerIndex = newCenterIndex;
            this.updateViewsLayout(true);
            this.updateArrowsVisibility();
        }
    }

    updateViewsLayout(animate = false) {
        const screenWidth = this.game.pixi.screen.width;
        const edgeOffset = screenWidth * 0.425; // 边缘视图的偏移量
        const animationDuration = animate ? 300 : 0; // 动画时长

        for (let i = 0; i < this.userViews.length; i++) {
            const view = this.userViews[i];
            const diff = i - this.centerIndex;

            if (diff === 0) {
                // 中间视图：正常显示，全宽
                // 使用背景图片区分可操作和不可操作，透明度统一为1.0
                const targetX = 0;
                const targetY = 0;
                const targetAlpha = 1.0;
                const targetScale = 1.0;
                
                if (animate) {
                    // 使用缓动动画
                    const startX = view.position.x;
                    const startY = view.position.y;
                    const startAlpha = view.alpha;
                    const startScale = view.scale.x;
                    
                    const tweenObj = {
                        x: startX,
                        y: startY,
                        alpha: startAlpha,
                        scale: startScale
                    };
                    
                    new TWEEN.Tween(tweenObj)
                        .to({ x: targetX, y: targetY, alpha: targetAlpha, scale: targetScale }, animationDuration)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .onUpdate(() => {
                            view.position.set(tweenObj.x, tweenObj.y);
                            view.alpha = tweenObj.alpha;
                            view.scale.set(tweenObj.scale);
                        })
                        .start();
                } else {
                    view.position.set(targetX, targetY);
                    view.alpha = targetAlpha;
                    view.scale.set(targetScale);
                }
                
                // 移到最上层
                this.setChildIndex(view, this.children.length - 1);
            } else {
                // 边缘视图：灰暗显示，缩小
                const side = diff > 0 ? 1 : -1; // 1=右侧, -1=左侧
                const targetX = side * edgeOffset;
                const targetY = 0;
                const targetAlpha = 0.3; // 边缘视图统一透明度
                const targetScale = 0.5; // 缩小
                
                if (animate) {
                    // 使用缓动动画
                    const startX = view.position.x;
                    const startY = view.position.y;
                    const startAlpha = view.alpha;
                    const startScale = view.scale.x;
                    
                    const tweenObj = {
                        x: startX,
                        y: startY,
                        alpha: startAlpha,
                        scale: startScale
                    };
                    
                    new TWEEN.Tween(tweenObj)
                        .to({ x: targetX, y: targetY, alpha: targetAlpha, scale: targetScale }, animationDuration)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .onUpdate(() => {
                            view.position.set(tweenObj.x, tweenObj.y);
                            view.alpha = tweenObj.alpha;
                            view.scale.set(tweenObj.scale);
                        })
                        .start();
                } else {
                    view.position.set(targetX, targetY);
                    view.alpha = targetAlpha;
                    view.scale.set(targetScale);
                }
            }
        }
    }

    updateArrowsVisibility() {
        if (this.leftArrow) {
            this.leftArrow.visible = this.centerIndex > 0;
        }
        if (this.rightArrow) {
            this.rightArrow.visible = this.centerIndex < this.userViews.length - 1;
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
        
        // 移除箭头
        if (this.leftArrow && this.leftArrow.parent) {
            this.leftArrow.parent.removeChild(this.leftArrow);
        }
        if (this.rightArrow && this.rightArrow.parent) {
            this.rightArrow.parent.removeChild(this.rightArrow);
        }
        
        // 从父容器移除
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}

export default TetrisGameView;

