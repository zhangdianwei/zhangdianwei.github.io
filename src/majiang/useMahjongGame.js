import { computed, reactive, ref } from 'vue'
import {
  chiOptions,
  chooseBotDiscard,
  countKey,
  createWall,
  isWinningHand,
  removeByKeys,
  scoreWinningHand,
  selfKongKeys,
  sortTiles,
  tileName,
} from './game.js'

const playerSeed = [
  { name: '玩家', wind: '东', human: true },
  { name: '陈默', wind: '南', human: false },
  { name: '林七', wind: '西', human: false },
  { name: '周放', wind: '北', human: false },
]

const winds = ['东', '南', '西', '北']
const roundFaces = ['一', '二', '三', '四']
const startingScore = 100
const recordKey = 'qingque-mahjong-records-v1'
const dailyKey = 'qingque-mahjong-daily-v1'
const dailyGoals = [
  { id: 'two-hands', label: '完成两局', metric: 'hand', target: 2 },
  { id: 'one-win', label: '赢得一局', metric: 'win', target: 1 },
  { id: 'one-call', label: '完成一次碰或杠', metric: 'call', target: 1 },
  { id: 'one-match', label: '打完一桌', metric: 'match', target: 1 },
]

function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function loadStored(key) {
  if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return {}
  try {
    const value = localStorage.getItem(key)
    const parsed = value ? JSON.parse(value) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function storedNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback
}

function saveStored(key, value) {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration))
const pace = { win: 1000, think: 880, kong: 560, humanDiscard: 710, botDiscard: 760, response: 480, claim: 820, settle: 260 }

export function useMahjongGame() {
  const players = reactive(playerSeed.map((player) => ({ ...player, hand: [], discards: [], melds: [] })))
  const wall = ref([])
  const scores = ref(playerSeed.map(() => startingScore))
  const roundIndex = ref(0)
  const currentPlayer = ref(0)
  const phase = ref('idle')
  const selectedTileId = ref(null)
  const drawnTileId = ref(null)
  const lastDiscard = ref(null)
  const claimEffect = ref(null)
  const winEffect = ref(null)
  const humanActions = ref([])
  const reaction = ref(null)
  const message = ref('准备开局')
  const winner = ref(null)
  const resultTitle = ref('')
  const resultText = ref('')
  const handResult = ref(null)
  const matchComplete = ref(false)
  const storedRecords = loadStored(recordKey)
  const records = reactive({
    matches: storedNumber(storedRecords.matches, 0),
    matchWins: storedNumber(storedRecords.matchWins, 0),
    hands: storedNumber(storedRecords.hands, 0),
    handWins: storedNumber(storedRecords.handWins, 0),
    bestScore: storedNumber(storedRecords.bestScore, startingScore),
    patterns: Array.isArray(storedRecords.patterns) ? storedRecords.patterns.filter((pattern) => typeof pattern === 'string') : [],
  })
  const today = localDate()
  const dailyGoal = dailyGoals[[...today].reduce((sum, char) => sum + (Number(char) || 0), 0) % dailyGoals.length]
  const dailyData = loadStored(dailyKey)
  const dailyProgress = ref(dailyData.date === today && dailyData.goalId === dailyGoal.id ? storedNumber(dailyData.progress, 0) : 0)
  let gameId = 0

  const isPlaying = computed(() => ['drawing', 'discarding', 'reaction'].includes(phase.value))
  const canDiscard = computed(() => phase.value === 'discarding' && currentPlayer.value === 0 && !reaction.value)
  const canPass = computed(() => phase.value === 'reaction' && Boolean(reaction.value))
  const dealerIndex = computed(() => roundIndex.value % players.length)
  const roundLabel = computed(() => `东${roundFaces[roundIndex.value]}局`)
  const standings = computed(() => players
    .map((player, index) => ({ index, name: player.name, score: scores.value[index] }))
    .sort((a, b) => b.score - a.score || a.index - b.index))
  const dailyComplete = computed(() => dailyProgress.value >= dailyGoal.target)

  function advanceDaily(metric) {
    if (dailyGoal.metric !== metric || dailyComplete.value) return
    dailyProgress.value = Math.min(dailyGoal.target, dailyProgress.value + 1)
    saveStored(dailyKey, { date: today, goalId: dailyGoal.id, progress: dailyProgress.value })
  }

  function saveRecords() {
    saveStored(recordKey, records)
  }

  function resetPlayers() {
    players.forEach((player) => {
      player.hand = []
      player.discards = []
      player.melds = []
    })
  }

  function startHand(token) {
    resetPlayers()
    wall.value = createWall()
    winner.value = null
    resultTitle.value = ''
    resultText.value = ''
    reaction.value = null
    humanActions.value = []
    selectedTileId.value = null
    drawnTileId.value = null
    lastDiscard.value = null
    claimEffect.value = null
    winEffect.value = null
    handResult.value = null
    players.forEach((player, index) => { player.wind = winds[(index - dealerIndex.value + players.length) % players.length] })
    currentPlayer.value = dealerIndex.value
    phase.value = 'drawing'
    for (let round = 0; round < 13; round += 1) {
      players.forEach((player) => player.hand.push(wall.value.pop()))
    }
    players.forEach((player) => sortTiles(player.hand))
    const dealer = players[dealerIndex.value]
    message.value = `${roundLabel.value}，${dealer.human ? '你' : dealer.name}坐庄`
    void drawCurrent(token)
  }

  function startGame() {
    gameId += 1
    scores.value = players.map(() => startingScore)
    roundIndex.value = 0
    matchComplete.value = false
    startHand(gameId)
  }

  function continueGame() {
    if (phase.value !== 'ended') return
    if (matchComplete.value) {
      startGame()
      return
    }
    gameId += 1
    roundIndex.value += 1
    startHand(gameId)
  }

  function stopGame() {
    gameId += 1
  }

  function settleHand(playerIndex, kind, tile) {
    const deltas = players.map(() => 0)
    let items = []
    let total = 0
    let newPatterns = []
    if (playerIndex !== null && tile) {
      const player = players[playerIndex]
      const tiles = kind === '点炮' ? [...player.hand, tile] : [...player.hand]
      const score = scoreWinningHand(tiles, player.melds, kind)
      items = score.items
      total = score.total
      if (kind === '自摸') {
        deltas[playerIndex] = total * 3
        deltas.forEach((_, index) => { if (index !== playerIndex) deltas[index] = -total })
      } else {
        const source = lastDiscard.value?.playerIndex ?? (playerIndex + players.length - 1) % players.length
        deltas[playerIndex] = total * 3
        deltas[source] = -total * 3
      }
      if (playerIndex === 0) {
        const patterns = items.map((item) => item.name).filter((name) => !['基础胡', '自摸'].includes(name) && !name.startsWith('杠牌'))
        newPatterns = patterns.filter((name) => !records.patterns.includes(name))
        records.patterns = [...records.patterns, ...newPatterns]
        records.handWins += 1
        advanceDaily('win')
      }
    }
    scores.value = scores.value.map((score, index) => score + deltas[index])
    records.hands += 1
    advanceDaily('hand')
    matchComplete.value = roundIndex.value === roundFaces.length - 1
    if (matchComplete.value) {
      records.matches += 1
      records.bestScore = Math.max(records.bestScore, scores.value[0])
      if (scores.value[0] === Math.max(...scores.value)) records.matchWins += 1
      advanceDaily('match')
    }
    saveRecords()
    handResult.value = { winner: playerIndex, kind, items, total, deltas, newPatterns }
    if (matchComplete.value) {
      const place = standings.value.findIndex((standing) => standing.index === 0) + 1
      resultTitle.value = place === 1 ? '你获得第一名' : `${standings.value[0].name}获得第一名`
      resultText.value = `东风四局结束 · 你获得第${place}名`
    } else if (playerIndex === null) {
      resultTitle.value = '本局流局'
      resultText.value = '牌墙摸完，四家积分不变'
    } else {
      const player = players[playerIndex]
      resultTitle.value = player.human ? '你胡了' : `${player.name}胡牌`
      resultText.value = `${player.wind}家${kind} · ${total}分牌型`
    }
  }

  function finishDraw() {
    phase.value = 'ended'
    humanActions.value = []
    reaction.value = null
    winner.value = null
    settleHand(null, '流局')
    message.value = '流局'
  }

  async function finishGame(playerIndex, kind, tile, token) {
    const player = players[playerIndex]
    phase.value = 'winning'
    currentPlayer.value = playerIndex
    winner.value = playerIndex
    humanActions.value = []
    reaction.value = null
    winEffect.value = { playerIndex, tile, kind }
    settleHand(playerIndex, kind, tile)
    message.value = player.human ? '你胡了' : `${player.name}胡牌`
    await wait(pace.win)
    if (token === gameId) phase.value = 'ended'
  }

  async function drawCurrent(token) {
    if (token !== gameId || !isPlaying.value) return
    if (!wall.value.length) return finishDraw()
    phase.value = 'drawing'
    const player = players[currentPlayer.value]
    const tile = wall.value.pop()
    player.hand.push(tile)
    drawnTileId.value = player.human ? tile.id : null
    if (player.human) {
      humanActions.value = []
      if (isWinningHand(player.hand, player.melds.length)) humanActions.value.push('hu')
      if (selfKongKeys(player.hand, player.melds).length && wall.value.length) humanActions.value.push('kong')
      message.value = `摸到${tileName(tile)}，请选择出牌`
      phase.value = 'discarding'
      return
    }
    message.value = `${player.name}正在思考`
    await wait(pace.think)
    if (token !== gameId || !isPlaying.value) return
    if (isWinningHand(player.hand, player.melds.length)) return finishGame(currentPlayer.value, '自摸', tile, token)
    const kong = selfKongKeys(player.hand, player.melds)[0]
    if (kong && wall.value.length) {
      performSelfKong(currentPlayer.value, kong)
      message.value = `${player.name}杠牌`
      await wait(pace.kong)
      if (token === gameId) await drawCurrent(token)
      return
    }
    await discardBotTile(token)
  }

  function performSelfKong(playerIndex, kong) {
    const player = players[playerIndex]
    if (kong.added) {
      const meld = player.melds.find((item) => item.type === 'pong' && item.tiles[0].key === kong.key)
      meld.tiles.push(removeByKeys(player.hand, [kong.key])[0])
      meld.type = 'kong'
    } else {
      player.melds.push({ type: 'kong', tiles: removeByKeys(player.hand, Array(4).fill(kong.key)), from: null, concealed: true })
    }
    sortTiles(player.hand)
  }

  async function discardBotTile(token) {
    if (token !== gameId || !isPlaying.value) return
    const playerIndex = currentPlayer.value
    const tileId = chooseBotDiscard(players[playerIndex].hand)
    await discard(playerIndex, tileId, token)
  }

  async function discard(playerIndex, tileId, token) {
    const player = players[playerIndex]
    const index = player.hand.findIndex((tile) => tile.id === tileId)
    if (index < 0) return
    const [tile] = player.hand.splice(index, 1)
    sortTiles(player.hand)
    player.discards.push(tile)
    lastDiscard.value = { tile, playerIndex }
    selectedTileId.value = null
    drawnTileId.value = null
    humanActions.value = []
    phase.value = 'reaction'
    message.value = `${player.name}打出${tileName(tile)}`
    await wait(player.human ? pace.humanDiscard : pace.botDiscard)
    if (token === gameId) await resolveDiscard(playerIndex, tile, token)
  }

  async function resolveDiscard(from, tile, token) {
    for (let distance = 1; distance <= 3; distance += 1) {
      const index = (from + distance) % 4
      const player = players[index]
      if (!isWinningHand([...player.hand, tile], player.melds.length)) continue
      if (player.human) {
        reaction.value = { from, tile, chi: [] }
        humanActions.value = ['hu']
        message.value = `${tileName(tile)}可以胡牌`
        return
      }
      await wait(pace.response)
      if (token === gameId) await finishGame(index, '点炮', tile, token)
      return
    }
    for (let distance = 1; distance <= 3; distance += 1) {
      const index = (from + distance) % 4
      const same = countKey(players[index].hand, tile.key)
      if (same < 2) continue
      if (!players[index].human) {
        const type = same >= 3 && wall.value.length ? 'kong' : 'pong'
        await claim(index, from, tile, type, Array(type === 'kong' ? 3 : 2).fill(tile.key), token)
        return
      }
      const chi = (from + 1) % 4 === 0 ? chiOptions(players[0].hand, tile) : []
      humanActions.value = [...(same >= 3 && wall.value.length ? ['kong'] : []), 'pong', ...(chi.length ? ['chi'] : [])]
      reaction.value = { from, tile, chi }
      message.value = `可以对${tileName(tile)}进行操作`
      return
    }
    const next = (from + 1) % 4
    const chi = chiOptions(players[next].hand, tile)
    if (chi.length) {
      if (players[next].human) {
        reaction.value = { from, tile, chi }
        humanActions.value = ['chi']
        message.value = `可以吃${tileName(tile)}`
        return
      }
      await claim(next, from, tile, 'chi', chi[0], token)
      return
    }
    await advance(from, token)
  }

  async function resolveBotClaims(from, tile, token) {
    for (let distance = 1; distance <= 3; distance += 1) {
      const index = (from + distance) % 4
      const player = players[index]
      if (!player.human && isWinningHand([...player.hand, tile], player.melds.length)) {
        await wait(pace.response)
        if (token === gameId) await finishGame(index, '点炮', tile, token)
        return
      }
    }
    for (let distance = 1; distance <= 3; distance += 1) {
      const index = (from + distance) % 4
      if (players[index].human) continue
      const same = countKey(players[index].hand, tile.key)
      if (same >= 2) {
        const type = same >= 3 && wall.value.length ? 'kong' : 'pong'
        await claim(index, from, tile, type, Array(type === 'kong' ? 3 : 2).fill(tile.key), token)
        return
      }
    }
    const next = (from + 1) % 4
    if (!players[next].human) {
      const option = chiOptions(players[next].hand, tile)[0]
      if (option) return claim(next, from, tile, 'chi', option, token)
    }
    await advance(from, token)
  }

  async function claim(playerIndex, from, tile, type, keys, token) {
    const player = players[playerIndex]
    const source = players[from]
    currentPlayer.value = playerIndex
    reaction.value = null
    humanActions.value = []
    claimEffect.value = { playerIndex, from, tile, type }
    message.value = `${player.name}${type === 'chi' ? '吃' : type === 'pong' ? '碰' : '杠'}牌`
    source.discards.pop()
    lastDiscard.value = null
    const owned = removeByKeys(player.hand, keys)
    sortTiles(player.hand)
    player.melds.push({ type, tiles: sortTiles([...owned, tile]), from })
    if (playerIndex === 0 && (type === 'pong' || type === 'kong')) advanceDaily('call')
    await wait(pace.claim)
    if (token !== gameId) return
    claimEffect.value = null
    await wait(pace.settle)
    if (token !== gameId) return
    if (type === 'kong') {
      await drawCurrent(token)
      return
    }
    phase.value = 'discarding'
    if (player.human) {
      message.value = '请选择一张牌打出'
      return
    }
    await discardBotTile(token)
  }

  async function advance(from, token) {
    currentPlayer.value = (from + 1) % 4
    reaction.value = null
    humanActions.value = []
    await drawCurrent(token)
  }

  function selectTile(tileId) {
    if (!canDiscard.value) return
    selectedTileId.value = selectedTileId.value === tileId ? null : tileId
  }

  function discardHumanTile() {
    if (canDiscard.value && selectedTileId.value !== null) void discard(0, selectedTileId.value, gameId)
  }

  function performHumanAction(action) {
    if (!humanActions.value.includes(action)) return
    if (action === 'hu') {
      const kind = reaction.value ? '点炮' : '自摸'
      const tile = reaction.value?.tile || players[0].hand.find((item) => item.id === drawnTileId.value) || players[0].hand.at(-1)
      void finishGame(0, kind, tile, gameId)
      return
    }
    if (action === 'kong' && !reaction.value) {
      const kong = selfKongKeys(players[0].hand, players[0].melds)[0]
      if (!kong) return
      performSelfKong(0, kong)
      advanceDaily('call')
      humanActions.value = []
      message.value = '杠牌，补摸一张'
      void drawCurrent(gameId)
      return
    }
    const pending = reaction.value
    const keys = action === 'chi' ? pending.chi[0] : Array(action === 'pong' ? 2 : 3).fill(pending.tile.key)
    void claim(0, pending.from, pending.tile, action, keys, gameId)
  }

  function passReaction() {
    const pending = reaction.value
    if (!pending) return
    reaction.value = null
    humanActions.value = []
    message.value = '已过，继续牌局'
    void resolveBotClaims(pending.from, pending.tile, gameId)
  }

  function forceHumanWin() {
    if (!isPlaying.value || !players[0].hand.length) return
    const kind = reaction.value ? '点炮' : '自摸'
    const tile = reaction.value?.tile || players[0].hand.find((item) => item.id === drawnTileId.value) || players[0].hand.at(-1)
    void finishGame(0, kind, tile, gameId)
  }

  return {
    players,
    wall,
    scores,
    roundIndex,
    roundLabel,
    dealerIndex,
    standings,
    currentPlayer,
    phase,
    selectedTileId,
    drawnTileId,
    lastDiscard,
    claimEffect,
    winEffect,
    humanActions,
    message,
    winner,
    resultTitle,
    resultText,
    handResult,
    matchComplete,
    records,
    dailyGoal,
    dailyProgress,
    dailyComplete,
    isPlaying,
    canDiscard,
    canPass,
    startGame,
    stopGame,
    continueGame,
    selectTile,
    discardHumanTile,
    performHumanAction,
    passReaction,
    forceHumanWin,
  }
}
