export function createCleanup() {
  const tasks = []

  const add = (task) => {
    tasks.push(task)
    return task
  }

  return {
    add,
    event(target, type, listener, options) {
      target.addEventListener(type, listener, options)
      add(() => target.removeEventListener(type, listener, options))
      return listener
    },
    pixi(target, type, listener, context) {
      target.on(type, listener, context)
      add(() => target.off(type, listener, context))
      return listener
    },
    timeout(callback, delay) {
      const id = window.setTimeout(callback, delay)
      add(() => window.clearTimeout(id))
      return id
    },
    interval(callback, delay) {
      const id = window.setInterval(callback, delay)
      add(() => window.clearInterval(id))
      return id
    },
    destroy() {
      tasks.splice(0).reverse().forEach((task) => task())
    },
  }
}

