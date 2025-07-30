import * as PIXI from 'pixi.js';
import { GameApp } from './GameApp.js';

export default class SpeedBoostUI extends PIXI.Container {
    constructor() {
        super();
        
        this.progress = 0; // 0-100
        this.isActive = false;
        this.timer = null;
        this.playerSnake = null;
        
        this.initUI();
        this.init();
        
        // 监听游戏状态变化
        this.checkPlayerSnake();
    }
    
    init() {
        // 假设外部会正确设置位置，这里不需要设置x,y
        this.startTimer();
    }
    
    initUI() {
        // 创建文字标签
        this.labelText = new PIXI.Text('等待加速：', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 32,
            fill: 0xffffff,
            stroke: 0x000000,
            strokeThickness: 4,
            align: 'left'
        });
        this.labelText.anchor.set(0, 0.5);
        this.labelText.x = 0;
        this.labelText.y = 0;
        this.addChild(this.labelText);
        
        // 创建进度条背景
        this.progressBarBg = new PIXI.Graphics();
        this.progressBarBg.beginFill(0x333333);
        this.progressBarBg.drawRoundedRect(0, 0, 300, 30, 15);
        this.progressBarBg.endFill();
        this.progressBarBg.x = this.labelText.width + 15;
        this.progressBarBg.y = -15;
        this.addChild(this.progressBarBg);
        
        // 创建进度条填充
        this.progressBarFill = new PIXI.Graphics();
        this.progressBarFill.beginFill(0x00ff00);
        this.progressBarFill.drawRoundedRect(0, 0, 0, 30, 15);
        this.progressBarFill.endFill();
        this.progressBarFill.x = this.labelText.width + 15;
        this.progressBarFill.y = -15;
        this.addChild(this.progressBarFill);
        
        // 创建进度条边框
        this.progressBarBorder = new PIXI.Graphics();
        this.progressBarBorder.lineStyle(3, 0xffffff);
        this.progressBarBorder.drawRoundedRect(0, 0, 300, 30, 15);
        this.progressBarBorder.x = this.labelText.width + 15;
        this.progressBarBorder.y = -15;
        this.addChild(this.progressBarBorder);
    }
    
    updateProgressBar() {
        // 更新进度条填充
        this.progressBarFill.clear();
        
        if (this.isActive) {
            // 加速中：绿色
            this.progressBarFill.beginFill(0x00ff00);
            this.labelText.text = '加速中：';
        } else {
            // 准备中：蓝色渐变
            this.progressBarFill.beginFill(0x0088ff);
            this.labelText.text = '等待加速：';
        }
        
        const fillWidth = (this.progress / 100) * 300;
        this.progressBarFill.drawRoundedRect(0, 0, fillWidth, 30, 15);
        this.progressBarFill.endFill();
        
        // 更新进度条位置，因为文字长度可能改变
        this.updateProgressBarPosition();
    }
    
    updateProgressBarPosition() {
        // 重新计算进度条位置，因为文字长度可能改变
        const newX = this.labelText.width + 15;
        this.progressBarBg.x = newX;
        this.progressBarFill.x = newX;
        this.progressBarBorder.x = newX;
    }
    
    getSize() {
        // 返回UI组件的尺寸
        const labelWidth = this.labelText ? this.labelText.width : 0;
        const progressBarWidth = 300; // 进度条宽度
        const spacing = 15; // 文字和进度条之间的间距
        const totalWidth = labelWidth + spacing + progressBarWidth;
        const totalHeight = 30; // 进度条高度
        
        return {
            width: totalWidth,
            height: totalHeight
        };
    }
    
    checkPlayerSnake() {
        // 定期检查玩家蛇是否存在
        const checkInterval = setInterval(() => {
            const gameApp = GameApp.instance;
            if (gameApp && gameApp.playerSnake && gameApp.playerSnake !== this.playerSnake) {
                this.playerSnake = gameApp.playerSnake;
            }
        }, 1000);
        
        // 保存清理函数
        this.checkInterval = checkInterval;
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            if (!this.isActive) {
                this.progress += 1; // 每100ms增加1%，10秒完成
                
                // 更新进度条
                this.updateProgressBar();
                
                if (this.progress >= 100) {
                    // 开始加速
                    this.activateSpeedBoost();
                }
            } else {
                // 加速过程中，进度条从100降到0
                this.progress -= 2; // 每100ms减少2%，5秒完成
                
                // 更新进度条
                this.updateProgressBar();
                
                if (this.progress <= 0) {
                    // 加速结束
                    this.deactivateSpeedBoost();
                }
            }
        }, 100); // 每100ms更新一次
    }
    
    activateSpeedBoost() {
        this.isActive = true;
        this.progress = 100; // 开始加速时进度为100
        
        // 设置玩家蛇速度为双倍
        if (this.playerSnake) {
            this.playerSnake.speedRatio = 3;
        }
        
        // 更新进度条
        this.updateProgressBar();
    }
    
    deactivateSpeedBoost() {
        // 恢复正常速度
        if (this.playerSnake) {
            this.playerSnake.speedRatio = 1;
        }
        
        // 重置状态，开始下一轮
        this.isActive = false;
        this.progress = 0;
        this.updateProgressBar();
    }
    
    destroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        super.destroy();
    }
} 