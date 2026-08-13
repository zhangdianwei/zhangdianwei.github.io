export const WORLD = { width: 900, height: 1200 }

export const levels = [
  {
    name: '新手村',
    target: 5,
    interval: 2000,
    types: ['hankey', 'hankey', 'bomb'],
    speed: 245,
    fallSpeed: 430,
    path: { type: 'line', start: { x: 0.1, y: 0.7 }, end: { x: 0.9, y: 0.7 } },
  },
  {
    name: '弯道挑战',
    target: 8,
    interval: 1800,
    types: ['hankey', 'hankey', 'hankey', 'bomb'],
    speed: 265,
    fallSpeed: 450,
    path: { type: 'arc', center: { x: 0.5, y: 0.58 }, radiusX: 0.4, radiusY: 0.14 },
  },
  {
    name: '波浪之旅',
    target: 10,
    interval: 1600,
    types: ['hankey', 'hankey', 'bomb', 'bomb'],
    speed: 285,
    fallSpeed: 470,
    path: { type: 'sin', start: { x: 0.1, y: 0.68 }, end: { x: 0.9, y: 0.68 }, amplitude: 0.05, frequency: 2 },
  },
  {
    name: '环形赛道',
    target: 10,
    interval: 1400,
    types: ['hankey', 'bomb'],
    speed: 300,
    fallSpeed: 490,
    path: { type: 'c', center: { x: 0.5, y: 0.58 }, radius: 0.31 },
  },
  {
    name: '终极挑战',
    target: 10,
    interval: 1200,
    types: ['hankey', 'bomb'],
    speed: 320,
    fallSpeed: 520,
    path: { type: 'sin', start: { x: 0.1, y: 0.66 }, end: { x: 0.9, y: 0.66 }, amplitude: 0.11, frequency: 1.5 },
  },
]

export function pathPosition(path, t) {
  if (path.type === 'arc') {
    const angle = Math.PI * t
    return {
      x: (path.center.x + Math.cos(angle) * path.radiusX) * WORLD.width,
      y: (path.center.y + Math.sin(angle) * path.radiusY) * WORLD.height,
    }
  }

  if (path.type === 'c') {
    const angle = -Math.PI * 0.25 + Math.PI * 1.5 * t
    const radius = path.radius * WORLD.width
    return {
      x: path.center.x * WORLD.width + Math.cos(angle) * radius,
      y: path.center.y * WORLD.height + Math.sin(angle) * radius,
    }
  }

  const x = (path.start.x + (path.end.x - path.start.x) * t) * WORLD.width
  const centerY = path.start.y * WORLD.height

  if (path.type === 'sin') {
    return {
      x,
      y: centerY + Math.sin(t * path.frequency * Math.PI * 2) * path.amplitude * WORLD.height,
    }
  }

  return { x, y: centerY }
}

export function createTrack(path, samples = 240) {
  const points = Array.from({ length: samples + 1 }, (_, index) => pathPosition(path, index / samples))
  let total = 0
  points.forEach((point, index) => {
    if (index) total += Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y)
    point.distance = total
  })

  const pointAt = (distance) => {
    const value = Math.max(0, Math.min(total, distance))
    let low = 1
    let high = points.length - 1
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (points[middle].distance < value) low = middle + 1
      else high = middle
    }
    const end = points[low]
    const start = points[low - 1]
    const span = end.distance - start.distance || 1
    const ratio = (value - start.distance) / span
    return {
      x: start.x + (end.x - start.x) * ratio,
      y: start.y + (end.y - start.y) * ratio,
      angle: Math.atan2(end.y - start.y, end.x - start.x),
    }
  }

  return { points, total, pointAt }
}
