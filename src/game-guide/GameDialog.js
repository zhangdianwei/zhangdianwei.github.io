import * as PIXI from 'pixi.js'
import { createCleanup } from './createCleanup.js'

export default class GameDialog extends PIXI.Container {
  constructor(app) {
    super()
    this.app = app
    this.cleanup = createCleanup()
    this.managers = []
    this.shown = false
    this.disposed = false
  }

  use(manager) {
    this.managers.push(manager)
    manager.init?.(this)
    if (this.shown) manager.show?.()
    return manager
  }

  mount(...args) {
    this.onCreate(...args)
    this.layout(this.app.pixi.screen)
  }

  show() {
    if (this.shown) return
    this.shown = true
    this.visible = true
    this.managers.forEach((manager) => manager.show?.())
    this.onShow()
  }

  hide() {
    if (!this.shown) return
    this.shown = false
    this.onHide()
    this.managers.slice().reverse().forEach((manager) => manager.hide?.())
    this.visible = false
  }

  update(delta) {
    this.onUpdate(delta)
  }

  layout(screen) {
    this.onResize(screen)
  }

  onCreate() {}

  onShow() {}

  onHide() {}

  onUpdate() {}

  onResize() {}

  onDestroy() {}

  destroy() {
    if (this.disposed) return
    this.disposed = true
    this.onDestroy()
    this.managers.splice(0).reverse().forEach((manager) => manager.destroy?.())
    this.cleanup.destroy()
    this.app = null
    super.destroy({ children: true })
  }
}
