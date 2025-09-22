import * as PIXI from 'pixi.js';
import { TankApp } from './TankApp.js';

export default class TankGameSide extends PIXI.Container {
    constructor() {
        super();
        
        this.tankApp = TankApp.instance;
        
        // 面板尺寸
        this.panelWidth = 300;
        this.panelHeight = 600;
        
        // 锚点设置为(0, 0.5)
        // this.anchor.set(0, 0.5);
        
        // 位置设置为屏幕右侧
        this.x = this.tankApp.winW - this.panelWidth;
        this.y = this.tankApp.winH / 2;
        
        this.createPanel();
        this.createInfoTexts();
    }
    
    createPanel() {
        // 创建面板背景
        const panelBg = new PIXI.Graphics();
        panelBg.beginFill(0x000000, 0.8); // 半透明黑色背景
        panelBg.drawRoundedRect(0, -this.panelHeight/2, this.panelWidth, this.panelHeight, 10);
        panelBg.endFill();
        
        // 添加边框
        panelBg.lineStyle(2, 0xFFFFFF, 0.8);
        panelBg.drawRoundedRect(0, -this.panelHeight/2, this.panelWidth, this.panelHeight, 10);
        
        this.addChild(panelBg);
    }
    
    createInfoTexts() {
        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'left'
        });
        
        const titleStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 28,
            fill: 0x00FF00,
            align: 'center',
            fontWeight: 'bold'
        });
        
        // 标题
        const titleText = new PIXI.Text('游戏信息', titleStyle);
        titleText.anchor.set(0.5, 0);
        titleText.x = this.panelWidth / 2;
        titleText.y = -this.panelHeight/2 + 30;
        this.addChild(titleText);
        
        // 关卡信息
        this.levelText = new PIXI.Text('关卡: 1', textStyle);
        this.levelText.x = 30;
        this.levelText.y = -this.panelHeight/2 + 80;
        this.addChild(this.levelText);
        
        // 生命值信息
        this.livesText = new PIXI.Text('生命: 3', textStyle);
        this.livesText.x = 30;
        this.livesText.y = -this.panelHeight/2 + 120;
        this.addChild(this.livesText);
        
        // 敌人摧毁数量
        this.enemyDestroyedText = new PIXI.Text('击毁敌人: 0', textStyle);
        this.enemyDestroyedText.x = 30;
        this.enemyDestroyedText.y = -this.panelHeight/2 + 160;
        this.addChild(this.enemyDestroyedText);
        
        // 分隔线
        const line = new PIXI.Graphics();
        line.lineStyle(2, 0xFFFFFF, 0.5);
        line.moveTo(30, -this.panelHeight/2 + 200);
        line.lineTo(this.panelWidth - 30, -this.panelHeight/2 + 200);
        this.addChild(line);
    }
    
    update() {
        if (!this.tankApp.playerData) return;
        
        // 更新关卡信息
        this.levelText.text = `关卡: ${this.tankApp.playerData.levelId + 1}`;
        
        // 更新生命值信息
        this.livesText.text = `生命: ${this.tankApp.playerData.playerLives}`;
        
        // 更新敌人摧毁数量
        const destroyedCount = this.tankApp.playerData.enermyDestroyed ? this.tankApp.playerData.enermyDestroyed.length : 0;
        this.enemyDestroyedText.text = `击毁敌人: ${destroyedCount}`;
    }
    
}
