export default class StorageMgr {
  constructor(namespace = 'game') {
    this.prefix = `${namespace}:`
  }

  get(key, fallback = null) {
    const value = localStorage.getItem(this.prefix + key)
    return value === null ? fallback : JSON.parse(value)
  }

  set(key, value) {
    localStorage.setItem(this.prefix + key, JSON.stringify(value))
    return value
  }

  remove(key) {
    localStorage.removeItem(this.prefix + key)
  }

  clear() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => localStorage.removeItem(key))
  }
}
