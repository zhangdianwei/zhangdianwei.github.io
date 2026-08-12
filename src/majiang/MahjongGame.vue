<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Button, ButtonGroup, Icon, Modal } from 'view-ui-plus'
import MahjongTile from './MahjongTile.vue'
import { chooseBotDiscard, tileName } from './game.js'
import { useMahjongGame } from './useMahjongGame.js'
import { useTileMotion } from './useTileMotion.js'

const game = useMahjongGame()
const roundThemes = [
  { id: 'spring', name: '春庭', mark: '春' },
  { id: 'summer', name: '夏雨', mark: '夏' },
  { id: 'autumn', name: '秋灯', mark: '秋' },
  { id: 'winter', name: '冬夜', mark: '冬' },
]
const roundTheme = computed(() => roundThemes[game.roundIndex.value])
const soundOn = ref(true)
const autoPlay = ref(false)
const isDebug = import.meta.env.DEV
const tableRef = ref(null)
const actionCall = ref('')
let actionCallTimer = 0
let autoTimer = 0
let audioContext
const actionLabels = { chi: '吃', pong: '碰', kong: '杠', hu: '胡' }
const currentName = computed(() => game.players[game.currentPlayer.value]?.name || '')
const actingPlayerIndex = computed(() => game.canPass.value ? 0 : game.currentPlayer.value)
const centerStatus = computed(() => {
  if (game.phase.value === 'winning' || game.phase.value === 'ended') return game.message.value
  if (actingPlayerIndex.value !== 0) return `${game.players[actingPlayerIndex.value].name}操作`
  if (game.canPass.value || game.humanActions.value.length) return '请操作'
  if (game.canDiscard.value) return '请出牌'
  return '你的回合'
})
const arrowRotation = computed(() => [180, 90, 0, -90][actingPlayerIndex.value])
const statusText = computed(() => ['ended', 'winning'].includes(game.phase.value) ? game.message.value : `${currentName.value}回合`)
const callText = computed(() => game.phase.value === 'winning' ? '胡' : actionCall.value)
const resultMark = computed(() => game.matchComplete.value ? game.standings.value[0].index === 0 ? '冠' : '终' : game.winner.value === 0 ? '胡' : game.winner.value === null ? '和' : '终')
const showWinConfetti = computed(() => game.phase.value === 'ended' && game.handResult.value?.winner === 0)
const resultVisible = computed({ get: () => game.phase.value === 'ended', set: () => {} })
const tileEntities = computed(() => {
  const entities = game.players[0].hand.map((tile) => ({ tile, zone: 'hand', playerIndex: 0 }))
  game.players.forEach((player, playerIndex) => {
    visibleDiscards(playerIndex).forEach((tile) => entities.push({ tile, zone: 'discard', playerIndex }))
    player.melds.forEach((meld) => meld.tiles.forEach((tile) => entities.push({ tile, zone: 'meld', playerIndex })))
  })
  return entities
})
const motionItems = computed(() => tileEntities.value.map(({ tile, zone, playerIndex }) => ({ id: tile.id, zone, playerIndex })))
const { isMoving: tileMoving, styleFor: tileMotionStyle } = useTileMotion(motionItems, tableRef)
const confetti = Array.from({ length: 28 }, (_, index) => ({
  left: `${4 + (index * 37) % 92}%`,
  delay: `${(index % 9) * 70}ms`,
  color: ['#efbd56', '#f7f2dd', '#57af8c', '#d96d61'][index % 4],
}))

function tone(frequency = 440) {
  if (!soundOn.value) return
  const Audio = window.AudioContext || window.webkitAudioContext
  audioContext ||= new Audio()
  if (audioContext.state === 'suspended') void audioContext.resume()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(.06, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .08)
  oscillator.connect(gain).connect(audioContext.destination)
  oscillator.start()
  oscillator.stop(audioContext.currentTime + .08)
}

function selectTile(tile) {
  if (tileMoving.value) return
  game.selectTile(tile.id)
  tone(520)
}

function discard() {
  if (tileMoving.value) return
  tone(360)
  game.discardHumanTile()
}

function action(type) {
  tone(type === 'hu' ? 680 : 460)
  game.performHumanAction(type)
}

function debugWin() {
  if (!game.isPlaying.value) return
  autoPlay.value = false
  tone(680)
  game.forceHumanWin()
}

function resultAction() {
  tone(420)
  game.continueGame()
}

function scoreDelta(index) {
  const value = game.handResult.value?.deltas[index] || 0
  return value > 0 ? `+${value}` : `${value}`
}

function scheduleAuto() {
  window.clearTimeout(autoTimer)
  if (!autoPlay.value || tileMoving.value) return
  if (game.phase.value === 'ended') {
    autoPlay.value = false
    return
  }
  const autoAction = ['hu', 'kong', 'pong', 'chi'].find((type) => game.humanActions.value.includes(type))
  if (autoAction) {
    autoTimer = window.setTimeout(() => action(autoAction), 700)
    return
  }
  if (!game.canDiscard.value) return
  autoTimer = window.setTimeout(() => {
    if (!autoPlay.value || !game.canDiscard.value) return
    game.selectTile(chooseBotDiscard(game.players[0].hand))
    autoTimer = window.setTimeout(() => {
      if (autoPlay.value && game.canDiscard.value) discard()
    }, 420)
  }, 680)
}

function isHumanHand(entity) {
  return entity.zone === 'hand' && entity.playerIndex === 0
}

function sceneTileStyle(entity) {
  return {
    ...tileMotionStyle(entity.tile.id),
    zIndex: game.claimEffect.value?.tile.id === entity.tile.id || game.lastDiscard.value?.tile.id === entity.tile.id ? 22 : entity.zone === 'hand' ? 9 : entity.zone === 'meld' ? 4 : 3,
  }
}

function visibleDiscards(index) {
  return game.players[index].discards.slice(-18)
}

onMounted(game.startGame)
watch(() => game.message.value, (value) => {
  const match = value.match(/(吃|碰|杠)牌/)
  if (!match) return
  window.clearTimeout(actionCallTimer)
  actionCall.value = match[1]
  actionCallTimer = window.setTimeout(() => { actionCall.value = '' }, 1100)
})
watch([autoPlay, tileMoving, () => game.phase.value, () => game.canDiscard.value, () => game.humanActions.value.join(','), () => game.matchComplete.value], scheduleAuto, { flush: 'post' })
onBeforeUnmount(() => {
  game.stopGame()
  window.clearTimeout(actionCallTimer)
  window.clearTimeout(autoTimer)
  void audioContext?.close()
  audioContext = null
})
</script>

<template>
  <div class="mahjong-shell" :data-theme="roundTheme.id">
    <header class="mahjong-topbar">
      <div class="mahjong-brand">
        <span class="mahjong-mark">麻</span>
        <div>
          <strong>青雀麻将</strong>
          <small>本桌 · 第 {{ game.roundIndex.value + 1 }}/4 局 · {{ roundTheme.name }} · {{ game.scores.value[0] }} 分</small>
        </div>
      </div>
      <span class="mahjong-status"><i></i>{{ statusText }}</span>
      <ButtonGroup class="mahjong-tools">
        <Button v-if="isDebug" icon="md-trophy" title="直接判定玩家胜利" aria-label="直接判定玩家胜利" :disabled="!game.isPlaying.value" @click="debugWin" />
        <Button icon="md-person" :type="autoPlay ? 'primary' : 'default'" :title="autoPlay ? '关闭自动代打' : '开启自动代打'" :aria-label="autoPlay ? '关闭自动代打' : '开启自动代打'" @click="autoPlay = !autoPlay" />
        <Button :icon="soundOn ? 'md-volume-up' : 'md-volume-off'" :type="soundOn ? 'primary' : 'default'" :title="soundOn ? '关闭音效' : '打开音效'" :aria-label="soundOn ? '关闭音效' : '打开音效'" @click="soundOn = !soundOn" />
      </ButtonGroup>
    </header>

    <main ref="tableRef" class="mahjong-table" :data-theme-mark="roundTheme.mark">
      <section class="seat seat-top" :class="{ active: game.currentPlayer.value === 2, winning: game.winEffect.value?.playerIndex === 2 }">
        <div class="player" data-player-anchor="2"><span class="wind">{{ game.players[2].wind }}</span><span class="avatar">林</span><span class="player-name">{{ game.players[2].name }}<small>{{ game.players[2].hand.length }} 张 · {{ game.scores.value[2] }} 分</small></span></div>
        <div class="tile-backs backs-top"><i v-for="tile in game.players[2].hand" :key="tile.id"></i></div>
      </section>
      <section class="seat seat-left" :class="{ active: game.currentPlayer.value === 3, winning: game.winEffect.value?.playerIndex === 3 }">
        <div class="player" data-player-anchor="3"><span class="wind">{{ game.players[3].wind }}</span><span class="avatar">周</span><span class="player-name">{{ game.players[3].name }}<small>{{ game.players[3].hand.length }} 张 · {{ game.scores.value[3] }} 分</small></span></div>
        <div class="tile-backs backs-side"><i v-for="tile in game.players[3].hand" :key="tile.id"></i></div>
      </section>
      <section class="seat seat-right" :class="{ active: game.currentPlayer.value === 1, winning: game.winEffect.value?.playerIndex === 1 }">
        <div class="player" data-player-anchor="1"><span class="wind">{{ game.players[1].wind }}</span><span class="avatar">陈</span><span class="player-name">{{ game.players[1].name }}<small>{{ game.players[1].hand.length }} 张 · {{ game.scores.value[1] }} 分</small></span></div>
        <div class="tile-backs backs-side"><i v-for="tile in game.players[1].hand" :key="tile.id"></i></div>
      </section>

      <div v-for="index in [1, 2, 3]" :key="`meld-${index}`" class="melds" :class="`melds-${index}`">
        <div v-for="(meld, meldIndex) in game.players[index].melds" :key="meldIndex" class="meld">
          <span v-for="tile in meld.tiles" :key="tile.id" class="tile-slot mini-slot" :data-tile-slot="tile.id"></span>
        </div>
      </div>
      <div v-for="index in [0, 1, 2, 3]" :key="`discard-${index}`" class="discards" :class="`discards-${index}`">
        <span v-for="tile in visibleDiscards(index)" :key="tile.id" class="tile-slot mini-slot" :data-tile-slot="tile.id"></span>
      </div>

      <section class="turn-console" data-wall-anchor aria-live="polite">
        <small>第{{ game.roundIndex.value + 1 }}/4局 · {{ roundTheme.name }}</small>
        <div class="turn-dial"><Icon type="md-navigate" size="27" :style="{ transform: `rotate(${arrowRotation}deg)` }" /></div>
        <strong>{{ centerStatus }}</strong>
        <span>余 {{ game.wall.value.length }} 张</span>
      </section>

      <section class="self-player" :class="{ active: game.currentPlayer.value === 0, winning: game.winEffect.value?.playerIndex === 0 }">
        <div class="player" data-player-anchor="0"><span class="wind">{{ game.players[0].wind }}</span><span class="avatar">你</span><span class="player-name">玩家<small>{{ game.players[0].hand.length }} 张 · {{ game.scores.value[0] }} 分</small></span></div>
      </section>
      <div class="self-melds">
        <div v-for="(meld, meldIndex) in game.players[0].melds" :key="meldIndex" class="meld">
          <span v-for="tile in meld.tiles" :key="tile.id" class="tile-slot mini-slot" :data-tile-slot="tile.id"></span>
        </div>
      </div>

      <TransitionGroup name="action" tag="div" class="action-dock">
        <Button v-for="type in game.humanActions.value" :key="type" :type="type === 'hu' ? 'warning' : 'default'" :disabled="tileMoving" @click="action(type)">{{ actionLabels[type] }}</Button>
        <Button v-if="game.canPass.value" key="pass" :disabled="tileMoving" @click="game.passReaction">过</Button>
        <Button key="discard" type="warning" :disabled="tileMoving || !game.canDiscard.value || game.selectedTileId.value === null" @click="discard">打出</Button>
      </TransitionGroup>

      <section class="hand-zone">
        <p><i></i>{{ game.message.value }}</p>
        <div class="human-hand">
          <span v-for="tile in game.players[0].hand" :key="tile.id" class="tile-slot hand-slot" :data-tile-slot="tile.id"></span>
        </div>
      </section>

      <div class="tile-scene">
        <div v-for="entity in tileEntities" :key="entity.tile.id" class="scene-tile" :style="sceneTileStyle(entity)">
          <MahjongTile
            :tile="entity.tile"
            :small="entity.zone !== 'hand'"
            :fill="true"
            :selected="isHumanHand(entity) && game.selectedTileId.value === entity.tile.id"
            :drawn="isHumanHand(entity) && game.drawnTileId.value === entity.tile.id"
            :latest="entity.zone === 'discard' && game.lastDiscard.value?.tile.id === entity.tile.id"
            :winning="game.winEffect.value?.tile.id === entity.tile.id"
            :disabled="!isHumanHand(entity) || tileMoving || !game.canDiscard.value"
            @click="isHumanHand(entity) && selectTile(entity.tile)"
          />
        </div>
      </div>

      <Transition name="call"><div v-if="callText" class="action-call">{{ callText }}</div></Transition>
      <div v-if="showWinConfetti" class="confetti" aria-hidden="true">
        <i v-for="(piece, index) in confetti" :key="index" :style="{ left: piece.left, animationDelay: piece.delay, background: piece.color }"></i>
      </div>
    </main>

    <Modal v-model="resultVisible" class-name="mahjong-result-modal" :closable="false" :mask-closable="false" footer-hide>
      <div class="result-content">
        <span class="result-mark">{{ resultMark }}</span>
        <h2>{{ game.resultTitle.value }}</h2>
        <p>{{ game.resultText.value }}</p>
        <div v-if="game.handResult.value?.items.length" class="score-list">
          <div v-for="item in game.handResult.value.items" :key="item.name"><span>{{ item.name }}</span><strong>+{{ item.points }}</strong></div>
        </div>
        <h3>本桌积分</h3>
        <div class="standings">
          <div v-for="(standing, place) in game.standings.value" :key="standing.index" :class="{ self: standing.index === 0 }">
            <span><i>{{ place + 1 }}</i>{{ standing.index === 0 ? '你' : standing.name }}</span>
            <strong>{{ standing.score }} 分 <small>{{ scoreDelta(standing.index) }}</small></strong>
          </div>
        </div>
        <div v-if="game.handResult.value?.newPatterns.length" class="new-pattern">新牌型 · {{ game.handResult.value.newPatterns.join('、') }}</div>
        <div class="daily-progress" :class="{ complete: game.dailyComplete.value }"><span>今日目标</span><strong>{{ game.dailyGoal.label }} · {{ game.dailyComplete.value ? '已完成' : `${Math.min(game.dailyProgress.value, game.dailyGoal.target)}/${game.dailyGoal.target}` }}</strong></div>
        <div v-if="game.matchComplete.value" class="record-summary">累计 {{ game.records.matches }} 桌 · 第一名 {{ game.records.matchWins }} 次 · 最高 {{ game.records.bestScore }} 分 · 牌型 {{ game.records.patterns.length }} 种</div>
        <Button type="primary" :icon="game.matchComplete.value ? 'md-refresh' : 'md-arrow-forward'" long @click="resultAction">{{ game.matchComplete.value ? '再来一桌' : '继续下一局' }}</Button>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.mahjong-shell { --table:#17684f; --deep:#0b4b39; --accent:#efbd56; --console:rgba(8,72,53,.9); --edge:rgba(255,255,255,.17); --hand:rgba(3,28,21,.94); min-width:320px; min-height:100vh; padding:14px; background:#eef1ef; color:#23332c; font-family:"PingFang SC","Microsoft YaHei",sans-serif; }
.mahjong-shell[data-theme="summer"] { --table:#1d6274; --deep:#174957; --accent:#aee4eb; --console:rgba(29,91,108,.92); --edge:rgba(184,229,237,.28); --hand:rgba(8,34,43,.94); }
.mahjong-shell[data-theme="autumn"] { --table:#62613a; --deep:#454326; --accent:#f1c978; --console:rgba(91,89,50,.92); --edge:rgba(239,201,126,.3); --hand:rgba(32,29,15,.94); }
.mahjong-shell[data-theme="winter"] { --table:#46555b; --deep:#303d42; --accent:#dce9ed; --console:rgba(60,75,81,.94); --edge:rgba(225,237,240,.32); --hand:rgba(23,30,33,.95); }
.mahjong-topbar { width:min(1120px,100%); min-height:58px; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:14px; margin:0 auto; padding:9px 12px; border:1px solid #d8dfda; border-bottom:0; border-radius:7px 7px 0 0; background:#fff; }
.mahjong-brand { display:flex; align-items:center; gap:9px; }.mahjong-brand>div { display:grid; }.mahjong-brand strong { font-size:16px; font-weight:600; }.mahjong-brand small { color:#829088; font-size:12px; }.mahjong-mark { width:34px; height:34px; display:grid; place-items:center; border-radius:6px; background:var(--deep); color:#fff; font-weight:600; }.mahjong-status { display:flex; align-items:center; gap:7px; color:#69776f; font-size:13px; }.mahjong-status i { width:7px; height:7px; border-radius:50%; background:#d4a234; box-shadow:0 0 0 4px rgba(212,162,52,.14); }.mahjong-tools { justify-self:end; }
.mahjong-table { position:relative; width:min(1120px,100%); min-height:690px; margin:0 auto; overflow:hidden; border-radius:0 0 7px 7px; color:#fff; background-color:var(--table); background-image:linear-gradient(45deg,rgba(255,255,255,.025) 25%,transparent 25%,transparent 75%,rgba(255,255,255,.025) 75%),linear-gradient(-45deg,rgba(0,0,0,.025) 25%,transparent 25%,transparent 75%,rgba(0,0,0,.025) 75%); background-size:28px 28px; box-shadow:0 20px 54px rgba(30,59,47,.16); transition:background-color .8s ease; }
.mahjong-table::before { content:attr(data-theme-mark); position:absolute; right:58px; bottom:140px; color:var(--accent); font:110px/1 "Songti SC","SimSun",serif; opacity:.07; }.mahjong-table::after { content:""; position:absolute; inset:17px; border:1px solid var(--edge); border-radius:7px; pointer-events:none; }
.seat { position:absolute; z-index:4; }.seat-top { top:16px; left:50%; transform:translateX(-50%); }.seat-left { top:43%; left:18px; transform:translateY(-50%); }.seat-right { top:43%; right:18px; transform:translateY(-50%); }.player { display:flex; align-items:center; gap:7px; }.seat-left .player,.seat-right .player { flex-direction:column; }.wind { width:23px; height:23px; display:grid; place-items:center; border-radius:4px; background:var(--accent); color:#433716; font-size:13px; font-weight:600; }.avatar { width:36px; height:36px; display:grid; place-items:center; border:1px solid rgba(255,255,255,.38); border-radius:50%; background:var(--deep); transition:box-shadow .2s ease,background .8s ease; }.active .avatar { box-shadow:0 0 0 3px var(--accent),0 0 0 7px rgba(239,189,86,.18); }.winning .avatar { box-shadow:0 0 0 4px var(--accent),0 0 0 9px rgba(239,189,86,.2); }.player-name { display:grid; min-width:max-content; font-weight:600; }.player-name small { color:rgba(255,255,255,.72); font-size:11px; }.seat-left .player-name,.seat-right .player-name { display:none; }
.tile-backs { position:absolute; display:flex; gap:2px; }.tile-backs i { width:27px; height:39px; flex:none; border:2px solid #e1d7b7; border-radius:4px; background:repeating-linear-gradient(45deg,var(--deep) 0 4px,rgba(255,255,255,.22) 4px 8px); box-shadow:0 2px 0 rgba(0,0,0,.18); }.backs-top { top:52px; left:50%; transform:translateX(-50%); }.backs-side { top:46px; left:50%; flex-direction:column; transform:translateX(-50%); }.backs-side i { width:39px; height:27px; margin-top:-7px; }.seat-right .backs-side { top:auto; bottom:46px; }
.turn-console { position:absolute; z-index:5; top:43%; left:50%; width:142px; min-height:142px; display:grid; place-items:center; align-content:center; gap:4px; padding:10px; transform:translate(-50%,-50%); border:1px solid var(--edge); border-radius:7px; background:var(--console); box-shadow:0 12px 24px rgba(0,0,0,.16); }.turn-console small,.turn-console span { color:var(--accent); }.turn-console strong { font-weight:600; }.turn-dial { width:48px; height:48px; display:grid; place-items:center; border:1px solid var(--edge); border-radius:50%; color:var(--accent); }.turn-dial :deep(i) { transition:transform .35s ease; }
.discards { position:absolute; z-index:2; width:180px; display:flex; flex-wrap:wrap; justify-content:center; gap:3px; }.discards-2 { top:142px; left:50%; transform:translateX(-50%); }.discards-3 { top:40%; left:138px; transform:translateY(-50%); }.discards-1 { top:40%; right:138px; transform:translateY(-50%); }.discards-0 { bottom:184px; left:50%; transform:translateX(-50%); }.tile-slot { display:block; flex:none; pointer-events:none; }.mini-slot { width:27px; height:37px; }.melds,.self-melds { position:absolute; z-index:3; display:flex; gap:4px; }.melds-2 { top:102px; right:24px; }.melds-3 { top:99px; left:22px; flex-direction:column; }.melds-1 { top:99px; right:22px; flex-direction:column; }.meld { display:flex; gap:1px; }.self-player { position:absolute; z-index:6; left:20px; bottom:122px; }.self-melds { left:82px; bottom:123px; }.action-dock { position:absolute; z-index:8; right:18px; bottom:122px; display:flex; gap:6px; }.action-dock :deep(.ivu-btn) { min-width:44px; }.action-enter-active { transition:opacity .24s ease,transform .24s ease; }.action-enter-from { opacity:0; transform:translateY(7px); }
.hand-zone { position:absolute; z-index:7; right:0; bottom:0; left:0; min-height:116px; padding:8px 10px 13px; background:linear-gradient(180deg,transparent,rgba(3,37,27,.55) 20%,var(--hand)); }.hand-zone p { min-height:25px; display:flex; align-items:center; justify-content:center; gap:7px; margin:0; font-size:15px; }.hand-zone p i { width:7px; height:7px; border-radius:50%; background:var(--accent); }.human-hand { display:flex; align-items:end; justify-content:center; gap:3px; }.hand-slot { width:42px; height:58px; }
.tile-scene { position:absolute; inset:0; pointer-events:none; }.scene-tile { position:absolute; top:0; left:0; pointer-events:none; transition-property:transform,width,height; transition-timing-function:cubic-bezier(.2,.8,.2,1); }.scene-tile :deep(.mahjong-tile:not(:disabled)) { pointer-events:auto; }.action-call { position:absolute; z-index:18; top:25%; left:50%; width:60px; height:60px; display:grid; place-items:center; transform:translateX(-50%); border:2px solid var(--accent); border-radius:7px; background:var(--deep); color:var(--accent); font-size:29px; font-weight:600; box-shadow:0 12px 26px rgba(0,0,0,.18); }.call-enter-active,.call-leave-active { transition:opacity .25s ease,transform .25s ease; }.call-enter-from,.call-leave-to { opacity:0; transform:translate(-50%,8px) scale(.96); }
.confetti { position:absolute; inset:0; z-index:35; overflow:hidden; pointer-events:none; }.confetti i { position:absolute; top:-14px; width:8px; height:13px; animation:confetti-fall 2.4s ease-in forwards; }@keyframes confetti-fall { to { transform:translate3d(35px,720px,0) rotate(620deg); opacity:.15; } }
@media (max-width:720px) { .mahjong-shell { height:100dvh; min-height:0; display:flex; flex-direction:column; padding:0; }.mahjong-topbar { flex:none; grid-template-columns:1fr auto; border:0; border-radius:0; }.mahjong-status { display:none; }.mahjong-tools :deep(.ivu-btn) { width:40px; padding:0; }.mahjong-table { width:100%; min-height:0; flex:1; border-radius:0; }.mahjong-table::before { right:18px; bottom:198px; font-size:82px; }.seat-top { top:12px; }.seat-top .player-name { display:none; }.seat-left,.seat-right { top:40%; }.seat-left { left:9px; }.seat-right { right:9px; }.seat-left .wind,.seat-right .wind { display:none; }.tile-backs i { width:22px; height:32px; }.backs-top { top:46px; }.backs-top i:nth-child(n+12) { display:none; }.backs-side i { width:32px; height:22px; margin-top:-6px; }.backs-side i:nth-child(n+10) { display:none; }.turn-console { top:40%; width:120px; min-height:132px; }.discards { width:102px; gap:2px; }.discards-2 { top:112px; }.discards-3,.discards-1 { top:38%; width:50px; }.discards-3 { left:47px; }.discards-1 { right:47px; }.discards-0 { bottom:210px; }.mini-slot { width:23px; height:32px; }.melds-2 { top:86px; }.melds-3 { top:80px; left:8px; }.melds-1 { top:80px; right:8px; }.self-player { left:9px; bottom:161px; }.self-player .wind,.self-player .player-name { display:none; }.self-melds { left:49px; bottom:162px; }.action-dock { right:8px; bottom:160px; }.action-dock :deep(.ivu-btn) { min-width:40px; height:40px; padding:0 11px; }.hand-zone { min-height:153px; padding:8px 4px 9px; }.human-hand { width:308px; flex-wrap:wrap; gap:2px; margin:0 auto; }.hand-slot { width:39px; height:53px; } }
@media (max-width:360px) { .mahjong-brand small { display:none; }.mahjong-tools :deep(.ivu-btn) { width:37px; }.human-hand { width:300px; gap:1px; }.hand-slot { width:37px; height:51px; } }
@media (prefers-reduced-motion:reduce) { .mahjong-shell * { transition:none!important; animation-duration:.01ms!important; animation-iteration-count:1!important; } }
</style>

<style>
.mahjong-result-modal .ivu-modal { max-width:calc(100vw - 28px); }.mahjong-result-modal .ivu-modal-content { border-radius:7px; }.mahjong-result-modal .ivu-modal-body { padding:24px 28px; }.result-content { text-align:center; }.result-content h2 { margin:12px 0 4px; color:#27362f; font-size:23px; font-weight:600; }.result-content>p { margin:0 0 16px; color:#738079; }.result-content h3 { margin:12px 0 2px; color:#69766f; font-size:14px; font-weight:500; text-align:left; }.result-mark { width:54px; height:54px; display:grid; place-items:center; margin:0 auto; border-radius:7px; background:#17684f; color:#fff; font-size:25px; font-weight:600; }.score-list { padding:9px 0; border-top:1px solid #e3e8e5; border-bottom:1px solid #e3e8e5; }.score-list div,.standings>div,.daily-progress { min-height:28px; display:flex; align-items:center; justify-content:space-between; color:#536159; }.score-list strong,.standings .self,.daily-progress.complete strong { color:#17684f; }.standings { padding:2px 0 10px; }.standings span { display:flex; align-items:center; gap:8px; }.standings i { width:21px; height:21px; display:grid; place-items:center; border-radius:50%; background:#e5ebe7; font-size:12px; font-style:normal; }.standings .self i { background:#17684f; color:#fff; }.standings small { display:inline-block; min-width:25px; color:#7c8982; font-size:12px; }.new-pattern { padding:8px 0; border-top:1px solid #dde4df; color:#9a6d0d; font-weight:600; }.daily-progress { min-height:39px; border-top:1px solid #dde4df; font-size:14px; }.record-summary { margin-bottom:14px; padding-top:8px; border-top:1px solid #dde4df; color:#69766f; font-size:13px; line-height:1.5; }
@media (max-width:500px) { .mahjong-result-modal .ivu-modal-body { padding:20px; } }
</style>
