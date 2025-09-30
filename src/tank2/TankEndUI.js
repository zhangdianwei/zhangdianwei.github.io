import * as PIXI from 'pixi.js';
import { TankApp } from './TankApp.js';
import allLevels from './level/levels.json' with { type: 'json' };

export default class TankEndUI extends PIXI.Container {
    constructor() {
        super();
        
        this.tankApp = TankApp.instance;
        
        // 面板尺寸
        this.panelWidth = 800;
        this.panelHeight = 600;
        
        this.createPanel();
        this.createTitle();
        this.createStats();
        this.createButtons();
        this.updateTitleAndButton();
        this.updateStats();
    }
    
    createPanel() {
        // 创建面板背景
        const panelBg = new PIXI.Graphics();
        panelBg.beginFill(0x000000, 0.9); // 半透明黑色背景
        panelBg.drawRoundedRect(-this.panelWidth/2, -this.panelHeight/2, this.panelWidth, this.panelHeight, 15);
        panelBg.endFill();
        
        // 添加边框
        panelBg.lineStyle(3, 0xFFFFFF, 0.8);
        panelBg.drawRoundedRect(-this.panelWidth/2, -this.panelHeight/2, this.panelWidth, this.panelHeight, 15);
        
        this.addChild(panelBg);
    }
    
    createTitle() {
        const titleStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0x00FF00,
            align: 'center',
            fontWeight: 'bold'
        });
        
        this.titleText = new PIXI.Text('关卡完成', titleStyle);
        this.titleText.anchor.set(0.5, 0);
        this.titleText.x = 0;
        this.titleText.y = -this.panelHeight/2 + 40;
        this.addChild(this.titleText);
    }
    
    createStats() {
        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'left'
        });
        
        const labelStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFF00,
            align: 'left'
        });
        
        // 关卡用时
        this.timeText = new PIXI.Text('关卡用时: 00:00', textStyle);
        this.timeText.x = -this.panelWidth/2 + 50;
        this.timeText.y = -this.panelHeight/2 + 100;
        this.addChild(this.timeText);
        
    }
    
    createButtons() {
        // 创建单个按钮
        this.actionBtn = this.createButton('下一关', 0, 150);
        this.addChild(this.actionBtn);
        
        // 设置按钮点击事件
        this.setupButtonEvents();
    }
    
    createButton(text, x, y) {
        const button = new PIXI.Container();
        
        // 按钮背景
        const bg = new PIXI.Graphics();
        bg.beginFill(0x333333, 0.8);
        bg.drawRoundedRect(-80, -25, 160, 50, 8);
        bg.endFill();
        
        // 按钮边框
        bg.lineStyle(2, 0xFFFFFF, 0.8);
        bg.drawRoundedRect(-80, -25, 160, 50, 8);
        
        button.addChild(bg);
        
        // 按钮文字
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFFFF,
            align: 'center',
            fontWeight: 'bold'
        });
        buttonText.anchor.set(0.5, 0.5);
        button.addChild(buttonText);
        
        // 设置位置
        button.x = x;
        button.y = y;
        
        // 添加交互
        button.eventMode = 'static';
        button.cursor = 'pointer';
        
        // 悬停效果
        button.on('pointerover', () => {
            bg.clear();
            bg.beginFill(0x555555, 0.9);
            bg.drawRoundedRect(-80, -25, 160, 50, 8);
            bg.endFill();
            bg.lineStyle(2, 0x00FF00, 1);
            bg.drawRoundedRect(-80, -25, 160, 50, 8);
        });
        
        button.on('pointerout', () => {
            bg.clear();
            bg.beginFill(0x333333, 0.8);
            bg.drawRoundedRect(-80, -25, 160, 50, 8);
            bg.endFill();
            bg.lineStyle(2, 0xFFFFFF, 0.8);
            bg.drawRoundedRect(-80, -25, 160, 50, 8);
        });
        
        return button;
    }
    
    setupButtonEvents() {
        // 单个按钮点击事件
        this.actionBtn.on('pointerdown', () => {
            this.onActionButtonClick();
        });
    }
    
    // 按钮回调函数
    onActionButtonClick() {
        if (!this.tankApp.playerData) return;
        
        if (this.tankApp.playerData.levelEndType === 1) {
            // 胜利
            if (this.isLastLevel()) {
                // 最后一关胜利 - 返回菜单
                this.onBackToStart();
            } else {
                // 普通胜利 - 下一关
                this.onNextLevel();
            }
        } else {
            // 失败 - 重新开始
            this.onRestart();
        }
    }
    
    onBackToStart() {
        console.log('回到开始界面');
        // 切换到开始界面
        if (this.tankApp.logic && this.tankApp.logic.setUI) {
            this.tankApp.logic.setUI('TankStartUI');
        }
    }
    
    onRestart() {
        console.log('重新开始');
        // 重新开始当前关卡
        if (this.tankApp.playerData) {
            this.tankApp.playerData.resetOneLevelData(); // 重置关卡数据
        }
        if (this.tankApp.logic && this.tankApp.logic.setUI) {
            this.tankApp.logic.setUI('TankGameUI');
        }
    }
    
    onNextLevel() {
        console.log('下一关');
        // 进入下一关
        if (this.tankApp.playerData) {
            this.tankApp.playerData.levelId++;
            this.tankApp.playerData.resetOneLevelData(); // 重置关卡数据
        }
        if (this.tankApp.logic && this.tankApp.logic.setUI) {
            this.tankApp.logic.setUI('TankGameUI');
        }
    }
    
    updateStats() {
        if (!this.tankApp.playerData) return;
        
        // 使用playerData的格式化时间方法
        this.timeText.text = `关卡用时: ${this.tankApp.playerData.getFormattedLevelTime()}`;
    }
    
    setTitle(title) {
        this.titleText.text = title;
    }
    
    isLastLevel() {
        if (!this.tankApp.playerData) return false;
        
        // 从levels.json获取关卡总数
        const totalLevels = allLevels.length;
        return this.tankApp.playerData.levelId-1 >= totalLevels;
    }
    
    updateTitleAndButton() {
        if (!this.tankApp.playerData) return;
        
        // 更新标题
        if (this.tankApp.playerData.levelEndType === 1) {
            // 胜利
            this.titleText.text = '关卡胜利';
            this.titleText.style.fill = 0x00FF00; // 绿色
        } else {
            // 失败
            this.titleText.text = '关卡失败';
            this.titleText.style.fill = 0xFF0000; // 红色
        }
        
        // 更新按钮文本
        const buttonText = this.actionBtn.children[1]; // 获取按钮文字
        if (this.tankApp.playerData.levelEndType === 1) {
            // 胜利
            if (this.isLastLevel()) {
                // 最后一关胜利
                buttonText.text = '返回菜单';
            } else {
                // 普通胜利
                buttonText.text = '下一关';
            }
        } else {
            // 失败
            buttonText.text = '重新开始';
        }
    }
    
    show() {
        this.visible = true;
        this.alpha = 1;
    }
    
    hide() {
        this.visible = false;
        this.alpha = 0;
    }
    
}
