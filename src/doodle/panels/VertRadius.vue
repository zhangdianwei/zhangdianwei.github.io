<script setup>
import { computed } from "vue";
import { editor, selectedShape, touch } from "../editor.js";

const vid = computed(() => { editor.rev; return editor.mode === "shape" && editor.selectedVertIds.length === 1 ? editor.selectedVertIds[0] : null; });
const v = computed(() => { editor.rev; return vid.value ? selectedShape()?.verts.find(x => x.id === vid.value) : null; });
const pos = computed(() => { editor.rev; return vid.value ? editor.pixi?.vertScreen(vid.value) : null; });
const r = computed({
  get: () => v.value?.r ?? 0,
  set: val => { const t = v.value; if (t) { t.r = val; selectedShape().redraw(); touch(); } },
});
</script>

<template>
  <div v-if="v && pos" class="vr" :style="{ left: pos.x + 'px', top: (pos.y - 56) + 'px' }">
    <Slider v-model="r" :min="0" :max="1" :step="0.05" :tip-format="val => '尖角 ' + val" style="width:110px" />
  </div>
</template>

<style scoped>
.vr { position: fixed; z-index: 900; transform: translateX(-50%);
  background: #fff; padding: 2px 12px; border-radius: 16px; box-shadow: 0 2px 10px rgba(0,0,0,.18); }
</style>
