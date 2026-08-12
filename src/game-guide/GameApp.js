import { createCleanup } from './createCleanup.js'
import { createGameApp } from './createGameApp.js'
import DialogMgr from './DialogMgr.js'

export default class GameApp {
  constructor(textures = {}, options = {}) {
    this.textures = textures
    this.options = options
    this.data = {}
    this.managers = []
    this.pauseReasons = new Set()
    this.runtime = null
    this.pixi = null
    this.dialogMgr = null
    this.cleanup = null
    this.initialized = false
  }

  use(manager) {
    this.managers.push(manager)
    if (this.initialized) {
      manager.init?.(this)
      if (this.pauseReasons.size) manager.pause?.()
    }
    return manager
  }

  init(canvas) {
    this.cleanup = createCleanup()
    this.runtime = createGameApp(canvas, this.options)
    this.pixi = this.runtime.app
    this.dialogMgr = new DialogMgr(this)
    this.pixi.stage.addChild(this.dialogMgr.root)
    this.pixi.ticker.add(this.update, this)
    this.cleanup.add(() => this.pixi?.ticker.remove(this.update, this))
    this.cleanup.add(this.runtime.onResize((screen) => this.dialogMgr?.layout(screen)))
    this.managers.forEach((manager) => manager.init?.(this))
    this.initialized = true
    if (this.pauseReasons.size) {
      this.pixi.ticker.stop()
      this.managers.slice().reverse().forEach((manager) => manager.pause?.())
    }
    this.start()
  }

  start() {}

  update(delta) {
    this.dialogMgr?.update(delta)
  }

  pause(reason = 'manual') {
    if (this.pauseReasons.has(reason)) return
    const running = !this.pauseReasons.size
    this.pauseReasons.add(reason)
    if (!running || !this.initialized) return
    this.pixi?.ticker.stop()
    this.managers.slice().reverse().forEach((manager) => manager.pause?.())
  }

  resume(reason = 'manual') {
    if (!this.pauseReasons.delete(reason) || this.pauseReasons.size || !this.initialized) return
    this.managers.forEach((manager) => manager.resume?.())
    this.pixi?.ticker.start()
  }

  destroy() {
    this.dialogMgr?.destroy()
    this.dialogMgr = null
    this.managers.splice(0).reverse().forEach((manager) => manager.destroy?.())
    this.pauseReasons.clear()
    this.cleanup?.destroy()
    this.cleanup = null
    this.runtime?.destroy()
    this.runtime = null
    this.pixi = null
    this.initialized = false
  }
}
