const numberFaces = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const suitFaces = { wan: '万', tong: '筒', tiao: '条', wind: '', dragon: '' }
const honorFaces = {
  wind: ['', '东', '南', '西', '北'],
  dragon: ['', '中', '發', '白'],
}
const suitOrder = { wan: 0, tong: 1, tiao: 2, wind: 3, dragon: 4 }

export function makeTile(suit, rank, id = 0) {
  const face = suit === 'wind' || suit === 'dragon' ? honorFaces[suit][rank] : numberFaces[rank]
  return { id, key: `${suit}-${rank}`, suit, rank, face, suitFace: suitFaces[suit] }
}

export function tilesFromKeys(keys) {
  return keys.map((key, id) => {
    const [suit, rank] = key.split('-')
    return makeTile(suit, Number(rank), id)
  })
}

export function createWall(random = Math.random) {
  const wall = []
  let id = 0
  for (const suit of ['wan', 'tong', 'tiao']) {
    for (let rank = 1; rank <= 9; rank += 1) {
      for (let copy = 0; copy < 4; copy += 1) wall.push(makeTile(suit, rank, id++))
    }
  }
  for (let rank = 1; rank <= 4; rank += 1) {
    for (let copy = 0; copy < 4; copy += 1) wall.push(makeTile('wind', rank, id++))
  }
  for (let rank = 1; rank <= 3; rank += 1) {
    for (let copy = 0; copy < 4; copy += 1) wall.push(makeTile('dragon', rank, id++))
  }
  for (let index = wall.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[wall[index], wall[target]] = [wall[target], wall[index]]
  }
  return wall
}

export function sortTiles(tiles) {
  return tiles.sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || a.rank - b.rank || a.id - b.id)
}

export function countKey(tiles, key) {
  return tiles.reduce((count, tile) => count + Number(tile.key === key), 0)
}

export function removeByKeys(tiles, keys) {
  const remaining = [...tiles]
  const removed = []
  for (const key of keys) {
    const index = remaining.findIndex((tile) => tile.key === key)
    if (index < 0) return []
    removed.push(remaining.splice(index, 1)[0])
  }
  tiles.splice(0, tiles.length, ...remaining)
  return removed
}

export function chiOptions(hand, tile) {
  if (!['wan', 'tong', 'tiao'].includes(tile.suit)) return []
  return [
    [tile.rank - 2, tile.rank - 1],
    [tile.rank - 1, tile.rank + 1],
    [tile.rank + 1, tile.rank + 2],
  ]
    .filter(([a, b]) => a >= 1 && b <= 9)
    .map((ranks) => ranks.map((rank) => `${tile.suit}-${rank}`))
    .filter((keys) => keys.every((key) => countKey(hand, key) >= keys.filter((item) => item === key).length))
}

function canFormGroups(counts, groupsLeft) {
  if (groupsLeft === 0) return [...counts.values()].every((count) => count === 0)
  const first = [...counts.entries()].find(([, count]) => count > 0)
  if (!first) return false
  const [key, count] = first
  const [suit, rankText] = key.split('-')
  const rank = Number(rankText)
  if (count >= 3) {
    counts.set(key, count - 3)
    if (canFormGroups(counts, groupsLeft - 1)) return true
    counts.set(key, count)
  }
  if (['wan', 'tong', 'tiao'].includes(suit) && rank <= 7) {
    const next = `${suit}-${rank + 1}`
    const after = `${suit}-${rank + 2}`
    if ((counts.get(next) || 0) > 0 && (counts.get(after) || 0) > 0) {
      counts.set(key, count - 1)
      counts.set(next, counts.get(next) - 1)
      counts.set(after, counts.get(after) - 1)
      if (canFormGroups(counts, groupsLeft - 1)) return true
      counts.set(key, count)
      counts.set(next, counts.get(next) + 1)
      counts.set(after, counts.get(after) + 1)
    }
  }
  return false
}

export function isWinningHand(tiles, meldCount = 0) {
  const groups = 4 - meldCount
  if (tiles.length !== groups * 3 + 2) return false
  const counts = new Map()
  tiles.forEach((tile) => counts.set(tile.key, (counts.get(tile.key) || 0) + 1))
  for (const [key, count] of counts) {
    if (count < 2) continue
    counts.set(key, count - 2)
    if (canFormGroups(counts, groups)) return true
    counts.set(key, count)
  }
  return false
}

function isAllTriplets(tiles, melds) {
  if (melds.some((meld) => meld.type === 'chi')) return false
  const counts = new Map()
  tiles.forEach((tile) => counts.set(tile.key, (counts.get(tile.key) || 0) + 1))
  return [...counts.entries()].some(([pair, count]) => {
    if (count < 2) return false
    return [...counts.entries()].every(([key, value]) => (value - Number(key === pair) * 2) % 3 === 0)
  })
}

export function scoreWinningHand(tiles, melds, kind) {
  const items = [{ name: '基础胡', points: 1 }]
  const allTiles = [...tiles, ...melds.flatMap((meld) => meld.tiles)]
  const numberSuits = new Set(allTiles.filter((tile) => ['wan', 'tong', 'tiao'].includes(tile.suit)).map((tile) => tile.suit))
  const hasHonors = allTiles.some((tile) => tile.suit === 'wind' || tile.suit === 'dragon')
  const kongCount = melds.filter((meld) => meld.type === 'kong').length
  if (kind === '自摸') items.push({ name: '自摸', points: 1 })
  if (melds.every((meld) => meld.concealed)) items.push({ name: '门前清', points: 1 })
  if (isAllTriplets(tiles, melds)) items.push({ name: '碰碰胡', points: 2 })
  if (numberSuits.size === 1 && !hasHonors) items.push({ name: '清一色', points: 4 })
  else if (numberSuits.size === 1 && hasHonors) items.push({ name: '混一色', points: 2 })
  if (kongCount) items.push({ name: `杠牌 × ${kongCount}`, points: kongCount })
  return { items, total: items.reduce((sum, item) => sum + item.points, 0) }
}

export function selfKongKeys(hand, melds) {
  const counts = new Map()
  hand.forEach((tile) => counts.set(tile.key, (counts.get(tile.key) || 0) + 1))
  const concealed = [...counts.entries()].filter(([, count]) => count === 4).map(([key]) => ({ key, added: false }))
  const added = melds
    .filter((meld) => meld.type === 'pong' && countKey(hand, meld.tiles[0].key))
    .map((meld) => ({ key: meld.tiles[0].key, added: true }))
  return [...concealed, ...added]
}

function tileKeepScore(tile, hand) {
  const same = countKey(hand, tile.key)
  if (tile.suit === 'wind' || tile.suit === 'dragon') return same * 4
  const nearOne = hand.filter((item) => item.suit === tile.suit && Math.abs(item.rank - tile.rank) === 1).length
  const nearTwo = hand.filter((item) => item.suit === tile.suit && Math.abs(item.rank - tile.rank) === 2).length
  return same * 4 + nearOne * 2 + nearTwo + Number(tile.rank >= 3 && tile.rank <= 7)
}

export function chooseBotDiscard(hand) {
  return hand.reduce((choice, tile) => {
    const score = tileKeepScore(tile, hand)
    const choiceScore = tileKeepScore(choice, hand)
    return score < choiceScore || (score === choiceScore && tile.id > choice.id) ? tile : choice
  }, hand[0]).id
}

export function tileName(tile) {
  return `${tile.face}${tile.suitFace}`
}
