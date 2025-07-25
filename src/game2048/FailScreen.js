import * as PIXI from 'pixi.js';
import { GameApp } from './GameApp.js';

export default class FailScreen extends PIXI.Container {
    constructor({ width = 800, height = 600, onRestart = null } = {}) {
        super();
        this.eventMode = 'static';
        this.width = width;
        this.height = height;
        this.onRestart = onRestart;

        const rankList = GameApp.instance.rankList;

        // 半透明遮罩（全屏）
        const mask = new PIXI.Graphics();
        mask.beginFill(0x000000, 0.6);
        mask.drawRect(-width/2, -height/2, width, height);
        mask.endFill();
        this.addChild(mask);

        // 卡片整体垂直居中
        const rankCount = rankList.length;
        const minCardHeight = 260;
        const btnHeightVal = 60;
        const rowHeight = 32;
        const cardInnerPadding = 32;
        const titleHeight = 54;
        const rankTitleHeight = 28;
        const rankListHeight = rankCount > 0 ? rankCount * rowHeight : rowHeight;
        const rankToBtnGap = 32;
        const cardContentHeight = cardInnerPadding + titleHeight + 16 + rankTitleHeight + 16 + rankListHeight + rankToBtnGap + btnHeightVal + cardInnerPadding;
        const cardHeight = Math.max(minCardHeight, cardContentHeight);
        const cardWidth = 420;
        const card = new PIXI.Graphics();
        card.beginFill(0xffffff, 0.98);
        card.drawRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 32);
        card.endFill();
        card.x = 0;
        card.y = 0;
        this.addChild(card);

        // 卡片内容分层容器，便于整体居中
        const content = new PIXI.Container();
        content.x = 0;
        content.y = -cardHeight/2;
        this.addChild(content);

        // 失败大标题
        const title = new PIXI.Text('GAME OVER', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 48,
            fill: 0x222222,
            align: 'center',
        });
        title.anchor.set(0.5, 0);
        title.x = 0;
        title.y = cardInnerPadding;
        content.addChild(title);

        // 排行榜标题
        const rankTitle = new PIXI.Text('排行榜', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 24,
            fill: 0x666666,
            align: 'center',
        });
        rankTitle.anchor.set(0.5, 0);
        rankTitle.x = 0;
        rankTitle.y = title.y + titleHeight + 16;
        content.addChild(rankTitle);

        // 排行榜内容
        let rankListToShow = rankList.slice();
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
        const colRankX = -90;
        const colNameX = 0;
        const colValueX = 90;
        rankListToShow.forEach((item, i) => {
            const isPlayer = item.name === playerRank.name;
            // 排名
            const rankText = new PIXI.Text(`${i+1}`, {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 22,
                fill: isPlayer ? 0xff6600 : 0x333333,
                align: 'center',
            });
            rankText.anchor.set(0.5, 0);
            rankText.x = colRankX;
            rankText.y = rankTitle.y + rankTitleHeight + 16 + i * rowHeight;
            content.addChild(rankText);
            // 名字
            const nameText = new PIXI.Text(item.name, {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 22,
                fill: isPlayer ? 0xff6600 : 0x333333,
                align: 'center',
            });
            nameText.anchor.set(0.5, 0);
            nameText.x = colNameX;
            nameText.y = rankTitle.y + rankTitleHeight + 16 + i * rowHeight;
            content.addChild(nameText);
            // 分数
            const valueText = new PIXI.Text(`${item.value}`, {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 22,
                fill: isPlayer ? 0xff6600 : 0x333333,
                align: 'center',
            });
            valueText.anchor.set(0.5, 0);
            valueText.x = colValueX;
            valueText.y = rankTitle.y + rankTitleHeight + 16 + i * rowHeight;
            content.addChild(valueText);
        });

        // 重新开始按钮
        const btnWidth = 180;
        const btnY = rankTitle.y + rankTitleHeight + 16 + rankListHeight + rankToBtnGap;
        const btn = new PIXI.Graphics();
        btn.beginFill(0x2d8cf0, 1);
        btn.drawRoundedRect(-btnWidth/2, -btnHeightVal/2, btnWidth, btnHeightVal, 18);
        btn.endFill();
        btn.x = 0;
        btn.y = btnY + btnHeightVal/2;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        content.addChild(btn);

        const btnText = new PIXI.Text('重新开始', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 28,
            fill: 0xffffff,
            align: 'center',
        });
        btnText.anchor.set(0.5);
        btnText.x = 0;
        btnText.y = btn.y;
        btnText.eventMode = 'static';
        btnText.cursor = 'pointer';
        content.addChild(btnText);


        // backIn/backOut 缓动函数
        function easeOutBack(t) {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
        function easeInBack(t) {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return c3 * t * t * t - c1 * t * t;
        }

        // appear动画（backOut）
        this.scale.set(0);
        let appearTicker = PIXI.Ticker.shared;
        let appearTime = 0;
        const appearDuration = 0.28;
        const appearStep = (delta) => {
            appearTime += appearTicker.deltaMS / 1000;
            let t = Math.min(appearTime / appearDuration, 1);
            let s = easeOutBack(t);
            this.scale.set(s);
            if (t >= 1) {
                appearTicker.remove(appearStep);
                this.scale.set(1);
            }
        };
        appearTicker.add(appearStep);

        // disappear动画（backIn）
        const doRestart = () => {
            let disappearTicker = PIXI.Ticker.shared;
            let disappearTime = 0;
            const disappearDuration = 0.18;
            const disappearStep = (delta) => {
                disappearTime += disappearTicker.deltaMS / 1000;
                let t = Math.min(disappearTime / disappearDuration, 1);
                let s = 1 - easeInBack(t);
                this.scale.set(Math.max(s, 0));
                if (t >= 1) {
                    disappearTicker.remove(disappearStep);
                    this.scale.set(0);
                    if (typeof this.onRestart === 'function') this.onRestart();
                    this.visible = false;
                    this.destroy({ children: true });
                }
            };
            disappearTicker.add(disappearStep);
        };
        btn.on('pointertap', doRestart);
        btnText.on('pointertap', doRestart);
    }

    createUI() {
        const { width, height, onRestart, score = 0 } = this.options;
        this.removeChildren();

        // 计算整体内容高度
        const titleFontSize = 100;
        const scoreFontSize = 60;
        const btnHeight = 110;
        const btnMargin = 60;
        const contentHeight = titleFontSize + scoreFontSize + btnHeight + btnMargin * 2;
        let y = (height - contentHeight) / 2;

        // 标题
        const title = new PIXI.Text('游戏结束', {
            fontFamily: 'Arial',
            fontSize: titleFontSize,
            fontWeight: 'bold',
            fill: 0xff5e5e,
            align: 'center',
            dropShadow: true,
            dropShadowColor: '#000',
            dropShadowBlur: 10,
            dropShadowDistance: 4
        });
        title.anchor.set(0.5, 0);
        title.x = width / 2;
        title.y = y;
        this.addChild(title);
        y += titleFontSize + btnMargin;

        // 分数
        const scoreText = new PIXI.Text(`分数：${score}`, {
            fontFamily: 'Arial',
            fontSize: scoreFontSize,
            fill: 0xffe066,
            fontWeight: 'bold',
            align: 'center',
            dropShadow: true,
            dropShadowColor: '#000',
            dropShadowBlur: 6,
            dropShadowDistance: 2
        });
        scoreText.anchor.set(0.5, 0);
        scoreText.x = width / 2;
        scoreText.y = y;
        this.addChild(scoreText);
        y += scoreFontSize + btnMargin;

        // 按钮
        const btnWidth = 400;
        const restartBtn = new PIXI.Graphics();
        restartBtn.beginFill(0x4a90e2, 1);
        restartBtn.drawRoundedRect(-btnWidth/2, 0, btnWidth, btnHeight, 40);
        restartBtn.endFill();
        restartBtn.x = width / 2;
        restartBtn.y = y;
        restartBtn.eventMode = 'static';
        restartBtn.buttonMode = true;
        restartBtn.on('pointertap', () => {
            if (onRestart) onRestart();
        });
        this.addChild(restartBtn);

        // 按钮文字
        const btnText = new PIXI.Text('重新开始', {
            fontFamily: 'Arial',
            fontSize: 56,
            fill: 0xffffff,
            fontWeight: 'bold',
            align: 'center',
        });
        btnText.anchor.set(0.5, 0.5);
        btnText.x = width / 2;
        btnText.y = y + btnHeight / 2;
        this.addChild(btnText);
    }
}
