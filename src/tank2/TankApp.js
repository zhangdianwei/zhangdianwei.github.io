import AudioMgr from './AudioMgr.js'
import GameApp from './GameApp.js'
import PlayDialog from './PlayDialog.js'
import StartDialog from './StartDialog.js'
import { audioFiles } from './TankAssets.js'
import allLevels from './level/levels.json' with { type: 'json' }

export default class TankApp extends GameApp {
  constructor(textures) {
    super(textures, {
      worldWidth: 960,
      worldHeight: 720,
      scaleToParent: true,
      backgroundColor: 0x1b2524,
      backgroundAlpha: 1,
    })
    this.audioMgr = this.use(new AudioMgr({ volume: 0.8 }))
    this.data.nextPowerUpType = null
    this.resetPlayerData()
  }

  start() {
    void this.audioMgr.loadAll(audioFiles)
    this.dialogMgr.push(StartDialog)
  }

  setControl(control, pressed) {
    this.dialogMgr?.current?.onControl?.(control, pressed)
  }

  setNextPowerUp(type) {
    this.data.nextPowerUpType = type || null
  }

  consumeNextPowerUp() {
    const type = this.data.nextPowerUpType
    this.data.nextPowerUpType = null
    return type
  }

  startDebugLevel(levelId) {
    const next = Math.max(0, Math.min(allLevels.length - 1, Number(levelId) || 0))
    this.resetPlayerData(next)
    this.dialogMgr.replace(PlayDialog)
  }

  resetPlayerData(levelId = 0) {
    this.data.levelId = levelId
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
