<script setup>
import { ref } from "vue";
defineProps({ x: Number, y: Number, items: Array });
const emit = defineEmits(["close"]);
const openSub = ref(-1);

function pick(item, val) {
  if (item.children) return;
  if (item.input) { if (val == null || val === "") return; item.action(+val); }
  else item.action?.();
  emit("close");
}
</script>

<template>
  <div class="ctx" :style="{ left: x + 'px', top: y + 'px' }" @contextmenu.prevent>
    <div v-for="(it, i) in items" :key="i" class="item" @mouseenter="openSub = i">
      <template v-if="it.input">
        <span class="lb">{{ it.label }}</span>
        <input class="num" type="number" :value="it.input.def" :min="it.input.min"
          @click.stop @input="e => it.input.def = +e.target.value" @keydown.enter.stop="e => pick(it, e.target.value)" />
      </template>
      <template v-else-if="it.children">
        <span class="lb">{{ it.label }}</span><span class="arrow">▸</span>
        <div v-show="openSub === i" class="sub">
          <template v-for="(c, j) in it.children" :key="j">
            <div v-if="c.divider" class="sep"></div>
            <div v-else class="item" @mouseenter.stop @click.stop="pick(c, c.input?.def)">
              <template v-if="c.input">
                <span class="lb">{{ c.label }}</span>
                <input class="num" type="number" :value="c.input.def" :min="c.input.min"
                  @click.stop @input="e => c.input.def = +e.target.value" @keydown.enter.stop="e => pick(c, e.target.value)" />
              </template>
              <span v-else class="lb">{{ c.label }}</span>
            </div>
          </template>
        </div>
      </template>
      <span v-else class="lb" @click="pick(it)">{{ it.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.ctx { position: fixed; z-index: 1000; min-width: 132px; padding: 4px; background: #fff;
  border: 1px solid #e8eaec; border-radius: 6px; box-shadow: 0 4px 16px rgba(0,0,0,.16); font-size: 13px; }
.item { position: relative; display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 4px; cursor: pointer; white-space: nowrap; }
.item:hover { background: #f0faff; }
.lb { flex: 1; }
.arrow { color: #c5c8ce; }
.num { width: 48px; padding: 1px 4px; border: 1px solid #dcdee2; border-radius: 3px; }
.sub { position: absolute; left: 100%; top: -5px; min-width: 120px; padding: 4px;
  background: #fff; border: 1px solid #e8eaec; border-radius: 6px; box-shadow: 0 4px 16px rgba(0,0,0,.16); }
.sep { height: 1px; margin: 4px 6px; background: #e8eaec; }
</style>
