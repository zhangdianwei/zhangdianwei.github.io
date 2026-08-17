import * as PIXI from 'pixi.js'
import Dialog from './Dialog.js'
import { appear, disappear, makeButton } from './Game2048UI.js'
import { formatLevel } from './PlayCube.js'
import StartDialog from './StartDialog.js'

export default class ResultDialog extends Dialog {
    onCreate() {
        this.eventMode = 'static'
        this.rankList = this.app.data.rankList
        this.playerRank = this.app.data.playerRank
        const ranks = [...this.rankList, this.playerRank]
            .sort((a, b) => b.level - a.level)
            .map((item, index) => ({ ...item, rank: index + 1 }))
        const playerRank = ranks.findIndex((item) => item.id === this.playerRank.id)
        this.displayRanks = playerRank < 5 ? ranks.slice(0, 5) : [...ranks.slice(0, 4), ranks[playerRank]]
        this.screen = this.app.pixi.screen

        // 创建根节点并设置缩放
        this.root = new PIXI.Container()
        this.root.scale.set(0.5)
        this.addChild(this.root)

        this.createMask()
        this.createCard()
        this.createTitle()
        this.createRankList()
        this.createRestartButton()
        this.setupAnimations()
    }

    onResize(screen) {
        this.position.set(screen.width / 2, screen.height / 2)
        this.resize(screen)
    }

    createMask() {
        // 半透明遮罩（全屏）
        this.maskGraphic = new PIXI.Graphics()
        this.root.addChild(this.maskGraphic)
        this.resize(this.screen)
    }

    resize(screen) {
        this.maskGraphic.clear()
        this.maskGraphic.beginFill(0x000000, 0.6)
        this.maskGraphic.drawRect(
            -screen.width,
            -screen.height,
            screen.width * 2,
            screen.height * 2,
        )
        this.maskGraphic.endFill()
    }

    createCard() {
        const rankCount = this.displayRanks.length
        const minCardHeight = 520 // 放大一倍
        const btnHeightVal = 120 // 放大一倍
        const rowHeight = 64 // 放大一倍
        const cardInnerPadding = 64 // 放大一倍
        const titleHeight = 108 // 放大一倍
        const rankTitleHeight = 56 // 放大一倍
        const rankListHeight = rankCount > 0 ? rankCount * rowHeight : rowHeight
        const rankToBtnGap = 64 // 放大一倍
        const cardContentHeight =
            cardInnerPadding +
            titleHeight +
            32 +
            rankTitleHeight +
            32 +
            rankListHeight +
            rankToBtnGap +
            btnHeightVal +
            cardInnerPadding
        const cardHeight = Math.max(minCardHeight, cardContentHeight)
        const cardWidth = 840 // 放大一倍

        const card = new PIXI.Graphics()
        card.beginFill(0xffffff, 0.98)
        card.drawRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 64) // 圆角也放大一倍
        card.endFill()
        card.x = 0
        card.y = 0
        this.root.addChild(card)

        // 卡片内容分层容器，便于整体居中
        this.content = new PIXI.Container()
        this.content.x = 0
        this.content.y = -cardHeight / 2
        this.root.addChild(this.content)

        this.cardHeight = cardHeight
        this.cardInnerPadding = cardInnerPadding
        this.titleHeight = titleHeight
        this.rankTitleHeight = rankTitleHeight
        this.rowHeight = rowHeight
        this.btnHeightVal = btnHeightVal
        this.rankToBtnGap = rankToBtnGap
    }

    createTitle() {
        // 失败大标题
        const title = new PIXI.Text('GAME OVER', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 96, // 放大一倍
            fill: 0x222222,
            align: 'center',
        })
        title.anchor.set(0.5, 0)
        title.x = 0
        title.y = this.cardInnerPadding
        this.content.addChild(title)

        // 排行榜标题
        const rankTitle = new PIXI.Text('排行榜', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 48, // 放大一倍
            fill: 0x666666,
            align: 'center',
        })
        rankTitle.anchor.set(0.5, 0)
        rankTitle.x = 0
        rankTitle.y = title.y + this.titleHeight + 32 // 间距也放大一倍
        this.content.addChild(rankTitle)
        this.rankTitle = rankTitle
    }

    createRankList() {
        // 三列布局：排名、名字、分数
        const colRankX = -180 // 放大一倍
        const colNameX = 0
        const colValueX = 180 // 放大一倍

        this.displayRanks.forEach((item, i) => {
            const isPlayer = item.id === this.playerRank.id
            // 排名
            const rankText = new PIXI.Text(`${item.rank}`, {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 44, // 放大一倍
                fill: isPlayer ? 0xff6600 : 0x333333,
                align: 'center',
            })
            rankText.anchor.set(0.5, 0)
            rankText.x = colRankX
            rankText.y = this.rankTitle.y + this.rankTitleHeight + 32 + i * this.rowHeight // 间距放大一倍
            this.content.addChild(rankText)

            // 名字
            const nameText = new PIXI.Text(item.name, {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 44, // 放大一倍
                fill: isPlayer ? 0xff6600 : 0x333333,
                align: 'center',
            })
            nameText.anchor.set(0.5, 0)
            nameText.x = colNameX
            nameText.y = this.rankTitle.y + this.rankTitleHeight + 32 + i * this.rowHeight // 间距放大一倍
            this.content.addChild(nameText)

            // 分数
            const valueText = new PIXI.Text(formatLevel(item.level), {
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: 44, // 放大一倍
                fill: isPlayer ? 0xff6600 : 0x333333,
                align: 'center',
            })
            valueText.anchor.set(0.5, 0)
            valueText.x = colValueX
            valueText.y = this.rankTitle.y + this.rankTitleHeight + 32 + i * this.rowHeight // 间距放大一倍
            this.content.addChild(valueText)
        })
    }

    createRestartButton() {
        const btnWidth = 360 // 放大一倍
        const rankListHeight = Math.max(1, this.displayRanks.length) * this.rowHeight
        const btnY =
            this.rankTitle.y + this.rankTitleHeight + 32 + rankListHeight + this.rankToBtnGap // 间距放大一倍

        const btn = new PIXI.Graphics()
        btn.beginFill(0x2d8cf0, 1)
        btn.drawRoundedRect(-btnWidth / 2, -this.btnHeightVal / 2, btnWidth, this.btnHeightVal, 36) // 圆角放大一倍
        btn.endFill()
        btn.x = 0
        btn.y = btnY + this.btnHeightVal / 2
        this.content.addChild(btn)

        const btnText = new PIXI.Text('重新开始', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 56, // 放大一倍
            fill: 0xffffff,
            align: 'center',
        })
        btnText.anchor.set(0.5)
        btnText.x = 0
        btnText.y = 0
        btn.addChild(btnText)

        // 使用makeButton简化按钮实现
        makeButton(btn, async () => {
            await disappear(this)
            if (!this.disposed) this.app.dialogMgr.replace(StartDialog)
        })
    }

    setupAnimations() {
        // 使用PixiAction的appear动画
        appear(this)
    }
}
