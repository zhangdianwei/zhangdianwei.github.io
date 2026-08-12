import * as PIXI from 'pixi.js'
import { Dialog } from '../game-guide/index.js'
import TetrisButton from './TetrisButton.js'
import PlayDialog from './PlayDialog.js'
import { GameStartMode } from './data/TetrisEvents.js'

export default class StartDialog extends Dialog {
    onCreate() {
        this.animationTime = 0
        this.initTitle()

        this.marathonButton = new TetrisButton(this.app, '经典模式', () => {
            this.app.dialogMgr.replace(PlayDialog, GameStartMode.Marathon)
        })
        this.marathonButton.position.set(0, 70)
        this.addChild(this.marathonButton)
    }

    onResize(screen) {
        this.position.set(screen.width / 2, screen.height / 2)
    }

    onUpdate(delta) {
        this.animationTime += delta
        const baseSpeed = 0.02

        for (let r = 0; r < this.titleTiles.length; r++) {
            const offset = this.animationTime * baseSpeed
            for (let i = 0; i < this.titleTiles[r].length; i++) {
                const tile = this.titleTiles[r][i]
                const x = tile.baseX + Math.sin(offset) * tile.amplitude
                tile.sprite.position.x = x
            }
        }
    }

    initTitle() {
        const tileSize = 20
        const letterSpacing = 5
        const letters = [
            { pattern: this.getTPattern(), colorIndex: 0 },
        ]

        let totalWidth = 0
        letters.forEach(letter => {
            totalWidth += letter.pattern[0].length * tileSize
        })
        totalWidth += (letters.length - 1) * letterSpacing

        const maxRow = 6
        const maxAmplitude = 8
        this.titleTiles = []
        for (let r = 0; r <= maxRow; r++) {
            this.titleTiles[r] = []
        }
        const baseY = -100

        let currentX = -totalWidth / 2
        letters.forEach((letter) => {
            const letterWidth = letter.pattern[0].length * tileSize
            const letterHeight = letter.pattern.length * tileSize

            for (let r = 0; r < letter.pattern.length; r++) {
                for (let c = 0; c < letter.pattern[r].length; c++) {
                    if (letter.pattern[r][c]) {
                        const texture = this.app.textures['tile' + (letter.colorIndex + 1)]
                        if (texture) {
                            const tileSprite = new PIXI.Sprite(texture)
                            tileSprite.anchor.set(0.5, 0.5)
                            const tileX = currentX + c * tileSize + tileSize / 2
                            const tileY = baseY + r * tileSize + tileSize / 2 - letterHeight / 2
                            tileSprite.position.set(tileX, tileY)
                            this.addChild(tileSprite)

                            const globalRow = r
                            const rowRatio = (maxRow - globalRow) / maxRow
                            const amplitude = maxAmplitude * rowRatio

                            this.titleTiles[globalRow].push({
                                sprite: tileSprite,
                                baseX: tileX,
                                amplitude: amplitude
                            })
                        }
                    }
                }
            }
            currentX += letterWidth + letterSpacing
        })
    }

    getTPattern() {
        return [
            [1, 1, 1, 1, 1],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0]
        ]
    }

}
