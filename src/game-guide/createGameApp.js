import * as PIXI from 'pixi.js'

const viewportSize = (canvas) => {
  const parent = canvas.parentElement
  return {
    width: Math.max(1, parent?.clientWidth || window.innerWidth),
    height: Math.max(1, parent?.clientHeight || window.innerHeight),
  }
}

const worldSize = (width, height, shortSide) => width <= height
  ? { width: shortSide, height: Math.round(shortSide * height / width) }
  : { width: Math.round(shortSide * width / height), height: shortSide }

export function createGameApp(canvas, options = {}) {
  const {
    shortSide = 640,
    backgroundColor = 0x000000,
    backgroundAlpha = 0,
    antialias = true,
  } = options
  const size = viewportSize(canvas)
  const world = worldSize(size.width, size.height, shortSide)
  const app = new PIXI.Application({
    view: canvas,
    width: world.width,
    height: world.height,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    antialias,
    backgroundColor,
    backgroundAlpha,
  })
  const listeners = new Set()
  let destroyed = false

  const resize = () => {
    if (destroyed) return
    const nextSize = viewportSize(canvas)
    const nextWorld = worldSize(nextSize.width, nextSize.height, shortSide)
    app.renderer.resize(nextWorld.width, nextWorld.height)
    canvas.style.width = `${nextSize.width}px`
    canvas.style.height = `${nextSize.height}px`
    listeners.forEach((listener) => listener(app.screen))
  }

  const observer = new ResizeObserver(resize)
  if (canvas.parentElement) observer.observe(canvas.parentElement)
  resize()

  return {
    app,
    resize,
    onResize(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      observer.disconnect()
      listeners.clear()
      app.destroy(false, { children: true })
    },
  }
}
