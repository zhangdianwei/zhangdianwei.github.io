import * as PIXI from 'pixi.js'

export default class DialogMgr {
  constructor(app) {
    this.app = app
    this.root = new PIXI.Container()
    this.stack = []
  }

  get current() {
    return this.stack[this.stack.length - 1] || null
  }

  push(DialogClass, ...args) {
    this.current?.deactivate()
    const dialog = new DialogClass(this.app)
    this.stack.push(dialog)
    this.root.addChild(dialog)
    dialog.mount(...args)
    dialog.show()
    return dialog
  }

  pop() {
    const dialog = this.stack.pop()
    if (!dialog) return null
    dialog.hide()
    this.root.removeChild(dialog)
    dialog.destroy()
    this.current?.activate()
    return dialog
  }

  replace(DialogClass, ...args) {
    const dialog = this.stack.pop()
    if (dialog) {
      dialog.hide()
      this.root.removeChild(dialog)
      dialog.destroy()
    }
    return this.push(DialogClass, ...args)
  }

  update(delta) {
    this.current?.update(delta)
  }

  layout(screen) {
    this.stack.forEach((dialog) => dialog.layout(screen))
  }

  clear() {
    while (this.stack.length) {
      const dialog = this.stack.pop()
      dialog.hide()
      this.root.removeChild(dialog)
      dialog.destroy()
    }
  }

  destroy() {
    this.clear()
    this.root.destroy({ children: true })
    this.root = null
    this.app = null
  }
}
