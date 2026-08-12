import * as TWEEN from '@tweenjs/tween.js'
import { GameApp } from '../game-guide/index.js'
import StartDialog from './StartDialog.js'

export default class TetrisApp extends GameApp {
  constructor(textures) {
    super(textures, {
      shortSide: 540,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
    })
  }

  start() {
    this.dialogMgr.push(StartDialog)
  }

  update(delta) {
    TWEEN.update()
    super.update(delta)
  }
}
