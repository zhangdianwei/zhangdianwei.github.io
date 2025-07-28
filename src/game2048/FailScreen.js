import * as PIXI from 'pixi.js';
import { GameApp } from './GameApp.js';
import { makeButton } from '../pixi/PixiUI.js';
import { disappear, appear } from '../pixi/PixiAction.js';

export default class FailScreen extends PIXI.Container {
    constructor({ onRestart = null } = {}) {
        super();
        this.eventMode = 'static';
        this.onRestart = onRestart;
        this.rankList = GameApp.instance.rankList;

        this.createMask();
        this.createCard();
        this.createTitle();
        this.createRankList();
        this.createRestartButton();
        this.setupAnimations();
    }

    createMask() {
        // 半透明遮罩（全屏）
        const mask = new PIXI.Graphics();
        mask.beginFill(0x000000, 0.6);
        const screenWidth = GameApp.instance.pixi.screen.width;
        const screenHeight = GameApp.instance.pixi.screen.height;
        mask.drawRect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        mask.endFill();
        this.addChild(mask);
    }

    createCard() {
        const rankCount = this.rankList.length;
        const minCardHeight = 520; // 放大一倍
        const btnHeightVal = 120; // 放大一倍
        const rowHeight = 64; // 放大一倍
        const cardInnerPadding = 64; // 放大一倍
        const titleHeight = 108; // 放大一倍
        const rankTitleHeight = 56; // 放大一倍
        const rankListHeight = rankCount > 0 ? rankCount * rowHeight : rowHeight;
        const rankToBtnGap = 64; // 放大一倍
        const cardContentHeight = cardInnerPadding + titleHeight + 32 + rankTitleHeight + 32 + rankListHeight + rankToBtnGap + btnHeightVal + cardInnerPadding;
        const cardHeight = Math.max(minCardHeight, cardContentHeight);
        const cardWidth = 840; // 放大一倍
        
        const card = new PIXI.Graphics();
        card.beginFill(0xffffff, 0.98);
        card.drawRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 64); // 圆角也放大一倍
        card.endFill();
        card.x = 0;
        card.y = 0;
        this.addChild(card);

        // 卡片内容分层容器，便于整体居中
        this.content = new PIXI.Container();
        this.content.x = 0;
        this.content.y = -cardHeight/2;
        this.addChild(this.content);

        this.cardHeight = cardHeight;
        this.cardInnerPadding = cardInnerPadding;
        this.titleHeight = titleHeight;
        this.rankTitleHeight = rankTitleHeight;
        this.rowHeight = rowHeight;
        this.btnHeightVal = btnHeightVal;
        this.rankToBtnGap = rankToBtnGap;
    }

    createTitle() {
        // 失败大标题
        const title = new PIXI.Text('GAME OVER', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 96, // 放大一倍
            fill: 0x222222,
            align: 'center',
        });
        title.anchor.set(0.5, 0);
        title.x = 0;
        title.y = this.cardInnerPadding;
        this.content.addChild(title);

        // 排行榜标题
        const rankTitle = new PIXI.Text('排行榜', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 48, // 放大一倍
            fill: 0x666666,
            align: 'center',
        });
        rankTitle.anchor.set(0.5, 0);
        rankTitle.x = 0;
        rankTitle.y = title.y + this.titleHeight + 32; // 间距也放大一倍
        this.content.addChild(rankTitle);
        this.rankTitle = rankTitle;
    }

    createRankList() {
        let rankListToShow = this.rankList.slice();
        // 利用GameApp.instance.playerRank，确保玩家一定出现且高亮
        const playerRank = GameApp.instance.playerRank;
        // 检查是否已在榜单（避免重复）
        let playerInRank = rankListToShow.some(item => item.name === playerRank.name);
        if (!playerInRank && playerRank.value > 0) {
            rankListToShow.push({ name: playerRank.name, value: playerRank.value });
        }
        // 排序并保留前5
        rankListToShow.sort((a, b) => b.value - a.value);
        
        // 三列布局：排名、名字、分数
        const colRankX = -180; // 放大一倍
        const colNameX = 0;
        const colValueX = 180; // 放大一倍
        
        rankListToShow.forEach((item, i) => {
            const isPlayer = item.name === playerRank.name;
            // 排名
            const rankText = new PIXI.Text(`${i+1}`, {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 44, // 放大一倍
                fill: isPlayer ? 0xff6600 : 0x333333,
                align: 'center',
            });
            rankText.anchor.set(0.5, 0);
            rankText.x = colRankX;
            rankText.y = this.rankTitle.y + this.rankTitleHeight + 32 + i * this.rowHeight; // 间距放大一倍
            this.content.addChild(rankText);
            
            // 名字
            const nameText = new PIXI.Text(item.name, {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 44, // 放大一倍
                fill: isPlayer ? 0xff6600 : 0x333333,
                align: 'center',
            });
            nameText.anchor.set(0.5, 0);
            nameText.x = colNameX;
            nameText.y = this.rankTitle.y + this.rankTitleHeight + 32 + i * this.rowHeight; // 间距放大一倍
            this.content.addChild(nameText);
            
            // 分数
            const valueText = new PIXI.Text(`${item.value}`, {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 44, // 放大一倍
                fill: isPlayer ? 0xff6600 : 0x333333,
                align: 'center',
            });
            valueText.anchor.set(0.5, 0);
            valueText.x = colValueX;
            valueText.y = this.rankTitle.y + this.rankTitleHeight + 32 + i * this.rowHeight; // 间距放大一倍
            this.content.addChild(valueText);
        });
    }

    createRestartButton() {
        const btnWidth = 360; // 放大一倍
        const rankListHeight = this.rankList.length > 0 ? this.rankList.length * this.rowHeight : this.rowHeight;
        const btnY = this.rankTitle.y + this.rankTitleHeight + 32 + rankListHeight + this.rankToBtnGap; // 间距放大一倍
        
        const btn = new PIXI.Graphics();
        btn.beginFill(0x2d8cf0, 1);
        btn.drawRoundedRect(-btnWidth/2, -this.btnHeightVal/2, btnWidth, this.btnHeightVal, 36); // 圆角放大一倍
        btn.endFill();
        btn.x = 0;
        btn.y = btnY + this.btnHeightVal/2;
        this.content.addChild(btn);

        const btnText = new PIXI.Text('重新开始', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 56, // 放大一倍
            fill: 0xffffff,
            align: 'center',
        });
        btnText.anchor.set(0.5);
        btnText.x = 0;
        btnText.y = 0;
        btn.addChild(btnText);

        // 使用makeButton简化按钮实现
        makeButton(btn, async () => {
            // 使用PixiAction的disappear动画
            await disappear(this, 0.18);
            if (typeof this.onRestart === 'function') this.onRestart();
            this.removeFromParent();
        });
    }

    setupAnimations() {
        // 使用PixiAction的appear动画
        appear(this, 0.28);
    }
}
