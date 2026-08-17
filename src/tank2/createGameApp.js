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
    worldWidth,
    worldHeight,
    backgroundColor = 0x000000,
    backgroundAlpha = 0,
    antialias = true,
    scaleToParent = false,
  } = options
  const fixedWorld = Number.isFinite(worldWidth) && Number.isFinite(worldHeight)
  const size = viewportSize(canvas)
  const world = fixedWorld ? { width: worldWidth, height: worldHeight } : worldSize(size.width, size.height, shortSide)
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
  let rafId = null
  let settleTimer = null

  const resize = () => {
    if (destroyed) return
    const nextSize = viewportSize(canvas)
    const nextWorld = fixedWorld ? world : worldSize(nextSize.width, nextSize.height, shortSide)
    app.renderer.resize(nextWorld.width, nextWorld.height)
    canvas.style.width = scaleToParent ? '100%' : `${nextSize.width}px`
    canvas.style.height = scaleToParent ? '100%' : `${nextSize.height}px`
    listeners.forEach((listener) => listener(app.screen))
  }

  const scheduleResize = () => {
    if (destroyed || rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      resize()
    })
  }

  const scheduleSettleResize = () => {
    if (destroyed) return
    clearTimeout(settleTimer)
    settleTimer = setTimeout(scheduleResize, 300)
  }

  const observer = new ResizeObserver(scheduleResize)
  if (canvas.parentElement) observer.observe(canvas.parentElement)

  window.addEventListener('resize', scheduleResize)
  window.addEventListener('orientationchange', scheduleSettleResize)
  document.addEventListener('fullscreenchange', scheduleSettleResize)
  document.addEventListener('webkitfullscreenchange', scheduleSettleResize)
  const visualViewport = window.visualViewport
  if (visualViewport) {
    visualViewport.addEventListener('resize', scheduleResize)
    visualViewport.addEventListener('scroll', scheduleResize)
  }

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
      if (rafId) cancelAnimationFrame(rafId)
      clearTimeout(settleTimer)
      window.removeEventListener('resize', scheduleResize)
      window.removeEventListener('orientationchange', scheduleSettleResize)
      document.removeEventListener('fullscreenchange', scheduleSettleResize)
      document.removeEventListener('webkitfullscreenchange', scheduleSettleResize)
      if (visualViewport) {
        visualViewport.removeEventListener('resize', scheduleResize)
        visualViewport.removeEventListener('scroll', scheduleResize)
      }
      listeners.clear()
      app.destroy(false, { children: true })
    },
  }
}

