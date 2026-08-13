export const WORLD = { width: 900, height: 1200 }

export const levels = [
  {
    name: '新手村',
    target: 5,
    interval: 2000,
    types: ['hankey', 'hankey', 'bomb'],
    speed: 0.012,
    path: { type: 'line', start: { x: 0.1, y: 0.7 }, end: { x: 0.9, y: 0.7 } },
  },
  {
    name: '弯道挑战',
    target: 8,
    interval: 1800,
    types: ['hankey', 'hankey', 'hankey', 'bomb'],
    speed: 0.014,
    path: { type: 'arc', center: { x: 0.5, y: 0.58 }, radiusX: 0.4, radiusY: 0.14 },
  },
  {
    name: '波浪之旅',
    target: 10,
    interval: 1600,
    types: ['hankey', 'hankey', 'bomb', 'bomb'],
    speed: 0.016,
    path: { type: 'sin', start: { x: 0.1, y: 0.68 }, end: { x: 0.9, y: 0.68 }, amplitude: 0.05, frequency: 2 },
  },
  {
    name: '环形赛道',
    target: 10,
    interval: 1400,
    types: ['hankey', 'bomb'],
    speed: 0.01,
    path: { type: 'circle', center: { x: 0.5, y: 0.56 }, radius: 0.32 },
  },
  {
    name: '终极挑战',
    target: 10,
    interval: 1200,
    types: ['hankey', 'bomb'],
    speed: 0.03,
    path: { type: 'wave', start: { x: 0.1, y: 0.68 }, end: { x: 0.9, y: 0.68 }, amplitude: 0.12, frequency: 2 },
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

  if (path.type === 'circle') {
    const angle = Math.PI * 2 * t
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

  if (path.type === 'wave') {
    const waveT = (t * path.frequency) % 1
    const inverse = 1 - waveT
    const amplitude = path.amplitude * WORLD.height
    return {
      x,
      y: inverse ** 3 * centerY
        + 3 * inverse ** 2 * waveT * (centerY + amplitude)
        + 3 * inverse * waveT ** 2 * (centerY - amplitude)
        + waveT ** 3 * centerY,
    }
  }

  return { x, y: centerY }
}
