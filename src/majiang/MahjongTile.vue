<script setup>
defineProps({
  tile: { type: Object, required: true },
  small: Boolean,
  selected: Boolean,
  drawn: Boolean,
  latest: Boolean,
  winning: Boolean,
  fill: Boolean,
  disabled: Boolean,
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="mahjong-tile"
    :class="[
      `tile-${tile.suit}`,
      { small, selected, drawn, latest, winning, fill },
    ]"
    :disabled="disabled"
    :aria-label="`${tile.face}${tile.suitFace}`"
    :aria-pressed="selected"
    @click="$emit('click')"
  >
    <strong>{{ tile.face }}</strong>
    <span>{{ tile.suitFace }}</span>
  </button>
</template>

<style scoped>
.mahjong-tile {
  position: relative;
  width: 42px;
  height: 58px;
  display: grid;
  align-content: center;
  justify-items: center;
  flex: none;
  padding: 0;
  border: 1px solid #d6d1c3;
  border-radius: 5px;
  background: #fffdf2;
  color: #26332d;
  box-shadow: 0 3px 0 rgba(0, 0, 0, .2);
  font-family: "Songti SC", "SimSun", serif;
  line-height: 1;
  transition: transform .18s ease, box-shadow .18s ease;
}

.mahjong-tile:not(:disabled) { cursor: pointer; }
.mahjong-tile:disabled { opacity: 1; }
.mahjong-tile strong { font-size: 19px; font-weight: 700; }
.mahjong-tile span { margin-top: 4px; font-size: 11px; font-weight: 700; }
.mahjong-tile.small { width: 27px; height: 37px; border-radius: 3px; box-shadow: 0 2px 0 rgba(0, 0, 0, .18); }
.mahjong-tile.small strong { font-size: 15px; }
.mahjong-tile.small span { margin-top: 2px; font-size: 9px; }
.mahjong-tile.selected { transform: translateY(-8px); box-shadow: 0 10px 0 rgba(0, 0, 0, .14), 0 0 0 3px #f0bd57; }
.mahjong-tile.drawn { box-shadow: 0 3px 0 rgba(0, 0, 0, .2), 0 0 0 2px #65b798; }
.mahjong-tile.latest { box-shadow: 0 2px 0 rgba(0, 0, 0, .18), 0 0 0 2px #f0bd57; }
.mahjong-tile.winning { box-shadow: 0 3px 0 rgba(0, 0, 0, .18), 0 0 0 3px #9ee0c5, 0 0 0 8px rgba(108, 194, 159, .18); animation: win-focus .42s ease; }
.mahjong-tile.fill { width: 100%; height: 100%; }
.tile-wan span { color: #b23d3d; }
.tile-tong span, .tile-dragon strong { color: #176d4f; }
.tile-tiao span { color: #2a6191; }

@keyframes win-focus {
  from { transform: scale(.95); }
}

@media (hover: hover) {
  .mahjong-tile:not(:disabled):hover { transform: translateY(-6px); }
}

@media (max-width: 560px) {
  .mahjong-tile { width: 39px; height: 53px; }
  .mahjong-tile strong { font-size: 18px; }
  .mahjong-tile.small { width: 23px; height: 32px; }
  .mahjong-tile.small strong { font-size: 13px; }
}

@media (max-width: 360px) {
  .mahjong-tile { width: 37px; height: 51px; }
}
</style>
