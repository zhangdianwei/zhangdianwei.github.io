<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import GameCanvas from './GameCanvas.vue'
import { shellAssets, textures } from './TankAssets.js'
import TankApp from './TankApp.js'

const view = ref(null)
const pressed = reactive({ up: false, right: false, down: false, left: false, a: false, select: false, start: false })
const directions = ['up', 'right', 'down', 'left']
const labels = { up: '上', right: '右', down: '下', left: '左', a: 'A键', select: '选择', start: '开始' }
const joystick = reactive({ x: 0, y: 0, originX: 0.22, originY: 0.72, pointerId: null })
const keyControls = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowRight: 'right', KeyD: 'right',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  Space: 'a', KeyJ: 'a',
  ShiftLeft: 'select', ShiftRight: 'select',
  Enter: 'start',
}
const controlSources = Object.fromEntries(Object.keys(pressed).map((control) => [control, new Set()]))
let game

function start(loadedTextures) {
  game?.destroy()
  game = new TankApp(loadedTextures)
  game.init(view.value.canvas)
  Object.keys(pressed).forEach((control) => {
    if (pressed[control]) game.setControl(control, true)
  })
}

function setControl(control, source, active) {
  const sources = controlSources[control]
  if (active) sources.add(source)
  else sources.delete(source)
  const next = sources.size > 0
  if (pressed[control] === next) return
  pressed[control] = next
  game?.setControl(control, next)
}

function press(control, event) {
  event.currentTarget.setPointerCapture?.(event.pointerId)
  setControl(control, `pointer:${event.pointerId}`, true)
}

function release(control, event) {
  setControl(control, `pointer:${event.pointerId}`, false)
  event.currentTarget.blur?.()
}

function moveJoystick(event) {
  if (joystick.pointerId !== event.pointerId) return
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left - rect.width * joystick.originX
  const y = event.clientY - rect.top - rect.height * joystick.originY
  const distance = Math.hypot(x, y)
  const height = window.visualViewport?.height || window.innerHeight
  const diameter = height * (window.matchMedia('(max-aspect-ratio: 3 / 2)').matches ? 0.18 : 0.28)
  const limit = diameter * 0.25
  const scale = distance > limit ? limit / distance : 1
  const active = distance > diameter * 0.1
  const horizontal = Math.abs(x) > Math.abs(y)
  joystick.x = x * scale
  joystick.y = y * scale
  setControl('left', 'joystick', active && horizontal && x < 0)
  setControl('right', 'joystick', active && horizontal && x > 0)
  setControl('up', 'joystick', active && !horizontal && y < 0)
  setControl('down', 'joystick', active && !horizontal && y > 0)
}

function startJoystick(event) {
  if (joystick.pointerId !== null) return
  const rect = event.currentTarget.getBoundingClientRect()
  joystick.pointerId = event.pointerId
  joystick.originX = (event.clientX - rect.left) / rect.width
  joystick.originY = (event.clientY - rect.top) / rect.height
  event.currentTarget.setPointerCapture?.(event.pointerId)
  moveJoystick(event)
}

function stopJoystick(event) {
  if (joystick.pointerId !== event.pointerId) return
  directions.forEach((control) => setControl(control, 'joystick', false))
  joystick.x = 0
  joystick.y = 0
  joystick.pointerId = null
}

function keyDown(event) {
  const control = keyControls[event.code]
  if (!control || event.repeat || event.target?.matches?.('input, textarea, select, [contenteditable="true"]')) return
  event.preventDefault()
  setControl(control, `key:${event.code}`, true)
}

function keyUp(event) {
  const control = keyControls[event.code]
  if (!control) return
  event.preventDefault()
  setControl(control, `key:${event.code}`, false)
}

function releaseKeys() {
  Object.entries(keyControls).forEach(([code, control]) => setControl(control, `key:${code}`, false))
}

onMounted(() => {
  window.addEventListener('keydown', keyDown)
  window.addEventListener('keyup', keyUp)
  window.addEventListener('blur', releaseKeys)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', keyDown)
  window.removeEventListener('keyup', keyUp)
  window.removeEventListener('blur', releaseKeys)
  Object.keys(pressed).forEach((control) => game?.setControl(control, false))
  game?.destroy()
})
</script>

<template>
  <main class="tank-stage">
    <div class="background" :style="{ borderImageSource: `url(${shellAssets.background})` }" />

    <div class="screen-shell">
      <div class="screen">
        <GameCanvas ref="view" :textures="textures" @ready="start" />
      </div>
      <img class="screen-frame" :src="shellAssets.screen" alt="" draggable="false">
    </div>

    <div
      class="joystick-zone"
      :style="{
        '--stick-origin-x': `${joystick.originX * 100}%`,
        '--stick-origin-y': `${joystick.originY * 100}%`,
        '--stick-x': `${joystick.x}px`,
        '--stick-y': `${joystick.y}px`,
      }"
      @pointerdown="startJoystick"
      @pointermove="moveJoystick"
      @pointerup="stopJoystick"
      @pointercancel="stopJoystick"
      @lostpointercapture="stopJoystick"
    >
      <div class="joystick">
        <img class="joystick-base" :src="shellAssets.joystickBase" alt="" draggable="false">
        <img class="joystick-knob" :src="shellAssets.joystickKnob" alt="" draggable="false">
      </div>
    </div>

    <button
      class="shell-control action"
      :class="{ 'is-pressed': pressed.a }"
      :aria-label="labels.a"
      @pointerdown="press('a', $event)"
      @pointerup="release('a', $event)"
      @pointercancel="release('a', $event)"
      @lostpointercapture="release('a', $event)"
    >
      <img :src="shellAssets.a" alt="" draggable="false">
    </button>

    <div class="meta-controls">
      <button
        v-for="control in ['select', 'start']"
        :key="control"
        class="shell-control meta-control"
        :class="{ 'is-pressed': pressed[control] }"
        :aria-label="labels[control]"
        @pointerdown="press(control, $event)"
        @pointerup="release(control, $event)"
        @pointercancel="release(control, $event)"
        @lostpointercapture="release(control, $event)"
      >
        <img :src="shellAssets[control]" alt="" draggable="false">
      </button>
    </div>
  </main>
</template>

<style scoped>
.tank-stage {
  --screen-frame-width: 117.551dvh;
  --screen-frame-height: 90dvh;
  --screen-inset: 3.6735dvh;
  --control-right: max(calc(env(safe-area-inset-right) + 12px), calc(25vw - 41.551dvh));
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: #bfd1da;
  user-select: none;
}

.background {
  position: absolute;
  inset: 0;
  z-index: 0;
  box-sizing: border-box;
  border-style: solid;
  border-width: 11.1111dvh min(37.037dvh, 50vw);
  border-image-slice: 120 400 fill;
  border-image-width: 1;
  border-image-repeat: stretch;
  pointer-events: none;
}

.screen-shell {
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 50%;
  width: var(--screen-frame-width);
  height: var(--screen-frame-height);
  transform: translate(-50%, -50%);
}

.screen {
  position: absolute;
  inset: var(--screen-inset);
  overflow: hidden;
  background: #1b2524;
}

.screen-frame {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.screen :deep(.game-root) {
  width: 100%;
  height: 100%;
}

.shell-control {
  appearance: none;
  position: absolute;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  touch-action: none;
}

.shell-control img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 80ms ease;
}

.joystick-zone {
  position: absolute;
  z-index: 3;
  inset: 0 50% 0 0;
  cursor: crosshair;
  touch-action: none;
}

.joystick {
  position: absolute;
  left: var(--stick-origin-x);
  top: var(--stick-origin-y);
  width: 28dvh;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.joystick-base {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.joystick-knob {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 44%;
  height: 44%;
  object-fit: contain;
  transform: translate(calc(-50% + var(--stick-x)), calc(-50% + var(--stick-y)));
}

.action {
  z-index: 3;
  right: var(--control-right);
  top: 72%;
  width: 28dvh;
  aspect-ratio: 1;
  transform: translateY(-50%);
}

.meta-controls {
  position: absolute;
  z-index: 3;
  top: 12dvh;
  right: max(calc(env(safe-area-inset-right) + 4px), calc(25vw - 44.301dvh));
  display: flex;
  gap: 1.5dvh;
}

.meta-control {
  position: relative;
  display: flex;
  align-items: center;
  width: 16dvh;
  height: 9dvh;
}

.meta-control img {
  height: auto;
}

.shell-control.is-pressed img {
  transform: scale(0.94);
}

.shell-control:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 2px;
}

@media (max-aspect-ratio: 3 / 2) {
  .joystick {
    width: 18dvh;
  }

  .action {
    width: 24dvh;
  }

  .meta-controls {
    display: none;
  }
}
</style>
