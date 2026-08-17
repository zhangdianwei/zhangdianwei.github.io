import * as TWEEN from '@tweenjs/tween.js'
import GameApp from './GameApp.js'
import StartDialog from './StartDialog.js'

const names = [
    '蛇皮怪',
    '打工魂',
    '摸鱼王',
    '卷王者',
    '菜鸡王',
    '蛇神君',
    '快乐蛇',
    '小憨憨',
    '野区王',
    '天命蛇',
    '混子哥',
    '高冷蛇',
    '咸鱼王',
    '天胡王',
    '操作王',
    '小白龙',
    '扛把子',
    '浪里蛇',
    '蛇皮侠',
    '小霸王',
    '一键蛇',
    '三连王',
    '蛇皮魂',
    '蛇皮哥',
]

export default class Game2048App extends GameApp {
    constructor(textures) {
        super(textures, {
            shortSide: 540,
            backgroundColor: 0x000000,
            antialias: false,
        })
        this.data.rankList = []
        this.data.playerRank = { id: 'player', name: 'YOU', level: 1 }
        this.nextEnemyId = 1
    }

    start() {
        this.dialogMgr.push(StartDialog)
    }

    update(delta) {
        TWEEN.update()
        super.update(delta)
    }

    randomName() {
        return names[Math.floor(Math.random() * names.length)]
    }

    createEnemyId() {
        return `enemy-${this.nextEnemyId++}`
    }

    updateRankList(id, name, level) {
        const list = this.data.rankList
        const item = list.find((entry) => entry.id === id)
        if (item) item.level = level
        else list.push({ id, name, level })
        list.sort((a, b) => b.level - a.level)
    }

    removeRank(id) {
        const index = this.data.rankList.findIndex((entry) => entry.id === id)
        if (index !== -1) this.data.rankList.splice(index, 1)
    }
}
