import GameApp from './GameApp.js'
import StartDialog from './StartDialog.js'

export default class TankApp extends GameApp {
  constructor(textures) {
    super(textures, {
      worldWidth: 960,
      worldHeight: 720,
      scaleToParent: true,
      backgroundColor: 0x1b2524,
      backgroundAlpha: 1,
    })
    this.resetPlayerData()
  }

  start() {
    this.dialogMgr.push(StartDialog)
  }

  setControl(control, pressed) {
    this.dialogMgr?.current?.onControl?.(control, pressed)
  }

  resetPlayerData() {
    this.data.levelId = 0
    this.data.playerLives = 2
    this.data.playerStarLevel = 0
    this.resetOneLevelData()
  }

  resetOneLevelData() {
    this.data.enermyDestroyed = []
    this.data.levelEndType = 0
    this.data.levelStartTime = Date.now()
  }

  addEnemyDestroyed(enemyType, count) {
    if (!this.data.enermyDestroyed[enemyType]) {
      this.data.enermyDestroyed[enemyType] = 0
    }
    this.data.enermyDestroyed[enemyType] += count
  }

  calculateLevelTime() {
    return Math.floor((Date.now() - this.data.levelStartTime) / 1000)
  }

  getFormattedLevelTime() {
    const time = this.calculateLevelTime()
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}
