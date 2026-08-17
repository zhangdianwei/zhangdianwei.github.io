import * as PIXI from 'pixi.js'
import { createCleanup } from './createCleanup.js'

export default class Dialog extends PIXI.Container {
  constructor(app) {
    super()
    this.app = app
    this.cleanup = createCleanup()
    this.managers = []
    this.shown = false
    this.active = false
    this.inactiveEventMode = null
    this.pending = new Set()
    this.disposed = false
  }

  use(manager) {
    this.managers.push(manager)
    manager.init?.(this)
    if (this.active) manager.show?.()
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
    this.onShow()
    this.activate()
  }

  hide() {
    if (!this.shown) return
    this.deactivate()
    this.shown = false
    this.onHide()
    this.visible = false
  }

  activate() {
    if (this.active) return
    this.active = true
    if (this.inactiveEventMode !== null) {
      this.eventMode = this.inactiveEventMode
      this.inactiveEventMode = null
    }
    this.managers.forEach((manager) => manager.show?.())
    this.onActivate()
    const pending = [...this.pending]
    this.pending.clear()
    for (const callback of pending) {
      if (this.disposed) break
      callback()
    }
  }

  deactivate() {
    if (!this.active) return
    this.active = false
    this.onDeactivate()
    this.managers.slice().reverse().forEach((manager) => manager.hide?.())
    this.inactiveEventMode = this.eventMode
    this.eventMode = 'none'
  }

  event(target, type, listener, options) {
    return this.cleanup.event(target, type, (...args) => {
      if (this.active) listener(...args)
    }, options)
  }

  pixi(target, type, listener, context) {
    return this.cleanup.pixi(target, type, (...args) => {
      if (this.active) listener.apply(context, args)
    })
  }

  interval(callback, delay) {
    return this.cleanup.interval(() => {
      if (this.active) callback()
    }, delay)
  }

  timeout(callback, delay) {
    let done = false
    const run = () => {
      if (done) return
      if (!this.active) {
        this.pending.add(run)
        return
      }
      done = true
      callback()
    }
    const id = window.setTimeout(run, delay)
    this.cleanup.add(() => {
      done = true
      this.pending.delete(run)
      window.clearTimeout(id)
    })
    return id
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

  onActivate() {}

  onDeactivate() {}

  onUpdate() {}

  onResize() {}

  onDestroy() {}

  destroy() {
    if (this.disposed) return
    this.disposed = true
    this.onDestroy()
    this.managers.splice(0).reverse().forEach((manager) => manager.destroy?.())
    this.cleanup.destroy()
    this.pending.clear()
    this.app = null
    super.destroy({ children: true })
  }
}

