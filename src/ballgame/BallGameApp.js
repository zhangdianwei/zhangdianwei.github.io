import AudioMgr from './AudioMgr.js'
import GameApp from './GameApp.js'
import { audioFiles } from './BallGameAssets.js'
import StartDialog from './StartDialog.js'

export default class BallGameApp extends GameApp {
  constructor(textures) {
    super(textures, {
      shortSide: 640,
      backgroundColor: 0x111827,
    })
    this.audioMgr = this.use(new AudioMgr({ volume: 0.7 }))
  }

  start() {
    void this.audioMgr.loadAll(audioFiles)
    this.dialogMgr.push(StartDialog)
  }
}
