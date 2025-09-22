import * as PIXI from 'pixi.js';
import { TankApp } from './TankApp.js';
import { makeButton } from '../pixi/PixiUI.js';

export default class TankStartUI extends PIXI.Container {
    constructor() {
        super();
        
        this.tankApp = TankApp.instance;
        this.textures = this.tankApp.textures;
        
        // UI元素
        this.titleText = null;
        this.singlePlayerButton = null;
        this.multiPlayerButton = null;
        this.onlineButton = null;
        
        this.createUI();
    }
    
    createUI() {
        // 创建标题
        this.createTitle();
        
        // 创建按钮组
        this.createButtons();
        
        // 创建背景装饰
        this.createBackground();
    }
    
    createTitle() {
        // 基于屏幕尺寸计算字体大小
        const titleFontSize = Math.min(this.tankApp.winW, this.tankApp.winH) * 0.08;
        const subtitleFontSize = titleFontSize * 0.5;
        
        // 主标题
        this.titleText = new PIXI.Text('坦克大战', {
            fontFamily: 'Arial',
            fontSize: titleFontSize,
            fontWeight: 'bold',
            fill: 0xFFD700, // 金色
            align: 'center',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 8,
            dropShadowDistance: 4,
            stroke: 0x8B4513, // 棕色描边
            strokeThickness: 3
        });
        this.titleText.anchor.set(0.5, 0.5);
        this.titleText.x = 0;
        this.titleText.y = -this.tankApp.winH * 0.15;
        this.addChild(this.titleText);
        
        // 副标题
        const subtitleText = new PIXI.Text('TANK BATTLE', {
            fontFamily: 'Arial',
            fontSize: subtitleFontSize,
            fontWeight: 'bold',
            fill: 0xFFA500, // 橙色
            align: 'center',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 4,
            dropShadowDistance: 2
        });
        subtitleText.anchor.set(0.5, 0.5);
        subtitleText.x = 0;
        subtitleText.y = -this.tankApp.winH * 0.08;
        this.addChild(subtitleText);
    }
    
    createButtons() {
        // 基于屏幕尺寸计算按钮大小和间距
        const buttonWidth = this.tankApp.winW * 0.25;
        const buttonHeight = this.tankApp.winH * 0.08;
        const buttonSpacing = this.tankApp.winH * 0.08;
        const buttonY = this.tankApp.winH * 0.05;
        const buttonFontSize = Math.min(buttonWidth, buttonHeight) * 0.3;
        
        // 单人游戏按钮
        this.singlePlayerButton = this.createButton('单人游戏', 0x228B22, () => {
            this.onSinglePlayer();
        }, buttonWidth, buttonHeight, buttonFontSize);
        this.singlePlayerButton.x = 0;
        this.singlePlayerButton.y = buttonY;
        this.addChild(this.singlePlayerButton);
        
        // 双人游戏按钮
        this.multiPlayerButton = this.createButton('双人游戏', 0x4169E1, () => {
            this.onMultiPlayer();
        }, buttonWidth, buttonHeight, buttonFontSize);
        this.multiPlayerButton.x = 0;
        this.multiPlayerButton.y = buttonY + buttonSpacing;
        this.addChild(this.multiPlayerButton);
        
        // 联网游戏按钮
        this.onlineButton = this.createButton('联网游戏', 0xFF6347, () => {
            this.onOnlineGame();
        }, buttonWidth, buttonHeight, buttonFontSize);
        this.onlineButton.x = 0;
        this.onlineButton.y = buttonY + buttonSpacing * 2;
        this.addChild(this.onlineButton);
    }
    
    createButton(text, color, onClick, width, height, fontSize) {
        const button = new PIXI.Container();
        
        // 按钮背景
        const background = new PIXI.Graphics();
        background.beginFill(color);
        background.lineStyle(4, 0xFFFFFF, 1);
        background.drawRoundedRect(-width/2, -height/2, width, height, height * 0.25);
        background.endFill();
        
        // 按钮文字
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: fontSize,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            align: 'center',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 3,
            dropShadowDistance: 2
        });
        buttonText.anchor.set(0.5, 0.5);
        
        button.addChild(background);
        button.addChild(buttonText);
        
        // 添加按钮交互
        makeButton(button, onClick);
        
        // 添加悬停效果
        button.on('pointerover', () => {
            background.tint = 0xCCCCCC;
            button.scale.set(1.05);
        });
        
        button.on('pointerout', () => {
            background.tint = 0xFFFFFF;
            button.scale.set(1);
        });
        
        return button;
    }
    
    createBackground() {
        // 创建装饰性边框
        this.createDecorativeBorder();
    }
    
    createDecorativeBorder() {
        // 基于屏幕尺寸创建装饰性边框
        const borderWidth = this.tankApp.winW * 0.8;
        const borderHeight = this.tankApp.winH * 0.8;
        const cornerSize = Math.min(this.tankApp.winW, this.tankApp.winH) * 0.02;
        const borderLineWidth = Math.min(this.tankApp.winW, this.tankApp.winH) * 0.003;
        
        const border = new PIXI.Graphics();
        border.lineStyle(borderLineWidth, 0xFFD700, 0.8);
        border.drawRoundedRect(-borderWidth/2, -borderHeight/2, borderWidth, borderHeight, cornerSize);
        
        // 添加角落装饰
        const corners = [
            { x: -borderWidth/2 + cornerSize, y: -borderHeight/2 + cornerSize },
            { x: borderWidth/2 - cornerSize, y: -borderHeight/2 + cornerSize },
            { x: -borderWidth/2 + cornerSize, y: borderHeight/2 - cornerSize },
            { x: borderWidth/2 - cornerSize, y: borderHeight/2 - cornerSize }
        ];
        
        corners.forEach(corner => {
            border.beginFill(0xFFD700, 0.3);
            border.drawRect(corner.x - cornerSize/2, corner.y - cornerSize/2, cornerSize, cornerSize);
            border.endFill();
        });
        
        this.addChildAt(border, 0); // 放在最底层
    }
    
    // 事件回调函数
    onSinglePlayer() {
        this.tankApp.logic.setUI('TankGameUI');
    }
    
    onMultiPlayer() {
        console.log('开始双人游戏');
        // 这里可以触发双人游戏逻辑
        // 例如：this.tankApp.logic.startMultiPlayer();
    }
    
    onOnlineGame() {
        console.log('开始联网游戏');
        // 这里可以触发联网游戏逻辑
        // 例如：this.tankApp.logic.startOnlineGame();
    }
    
}
