import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))

export function useTileMotion(items, tableRef) {
  const positions = ref({})
  const isMoving = ref(false)
  const zones = new Map()
  const signature = computed(() => items.value.map((item) => `${item.id}:${item.zone}:${item.playerIndex}`).join('|'))
  let initialized = false
  let revision = 0
  let movementTimer = 0
  let observer

  function measure(item, tableRect) {
    const slot = document.querySelector(`[data-tile-slot="${item.id}"]`)
    if (!slot) return null
    const rect = slot.getBoundingClientRect()
    return { left: rect.left - tableRect.left, top: rect.top - tableRect.top, width: rect.width, height: rect.height, duration: 0 }
  }

  function origin(item, target, tableRect) {
    const selector = item.zone === 'hand' ? '[data-wall-anchor]' : `[data-player-anchor="${item.playerIndex}"]`
    const anchor = document.querySelector(selector)?.getBoundingClientRect()
    if (!anchor) return target
    return {
      ...target,
      left: anchor.left - tableRect.left + (anchor.width - target.width) / 2,
      top: anchor.top - tableRect.top + (anchor.height - target.height) / 2,
    }
  }

  async function layout(animate = true) {
    const current = ++revision
    await nextTick()
    const table = tableRef.value
    if (!table || current !== revision) return
    const tableRect = table.getBoundingClientRect()
    const targets = {}
    items.value.forEach((item) => {
      const target = measure(item, tableRect)
      if (target) targets[item.id] = target
    })
    if (!initialized || !animate) {
      positions.value = targets
      items.value.forEach((item) => zones.set(item.id, item.zone))
      initialized = true
      return
    }
    const starts = {}
    let moving = false
    items.value.forEach((item) => {
      const target = targets[item.id]
      if (!target) return
      const previous = positions.value[item.id]
      const zoneChanged = zones.has(item.id) && zones.get(item.id) !== item.zone
      const start = previous || origin(item, target, tableRect)
      const distance = Math.hypot(target.left - start.left, target.top - start.top)
      const duration = previous && !zoneChanged && distance < 36 ? 220 : 650
      starts[item.id] = { ...start, duration: 0 }
      if (distance > 1 || Math.abs(target.width - start.width) > 1 || Math.abs(target.height - start.height) > 1) moving = true
    })
    positions.value = starts
    if (moving) {
      isMoving.value = true
      await frame()
      await frame()
      if (current !== revision) return
    }
    const animated = {}
    items.value.forEach((item) => {
      const target = targets[item.id]
      const start = starts[item.id]
      if (!target || !start) return
      const distance = Math.hypot(target.left - start.left, target.top - start.top)
      animated[item.id] = { ...target, duration: distance < 36 ? 220 : 650 }
      zones.set(item.id, item.zone)
    })
    positions.value = animated
    window.clearTimeout(movementTimer)
    if (moving) movementTimer = window.setTimeout(() => { isMoving.value = false }, 680)
  }

  watch(signature, () => void layout(true), { flush: 'post' })
  onMounted(() => {
    observer = new ResizeObserver(() => void layout(false))
    if (tableRef.value) observer.observe(tableRef.value)
    void layout(false)
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    window.clearTimeout(movementTimer)
  })

  function styleFor(id) {
    const position = positions.value[id]
    if (!position) return { opacity: 0 }
    return {
      width: `${position.width}px`,
      height: `${position.height}px`,
      transform: `translate3d(${position.left}px, ${position.top}px, 0)`,
      transitionDuration: `${position.duration}ms`,
    }
  }

  return { isMoving, styleFor }
}
