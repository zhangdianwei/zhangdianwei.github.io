export default class VisibilityMgr {
  init(app) {
    this.app = app
    this.onChange = () => {
      if (document.hidden) app.pause('visibility')
      else app.resume('visibility')
    }
    document.addEventListener('visibilitychange', this.onChange)
    this.onChange()
  }

  destroy() {
    document.removeEventListener('visibilitychange', this.onChange)
    this.app = null
  }
}
