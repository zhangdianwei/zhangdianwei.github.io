<script setup>
import { computed } from "vue";
import { editor, keyframeAt, recordProps } from "../editor.js";

// rb: { path, read }  read 返回分量数组;一属性一轨道
const props = defineProps({ node: Object, rb: Object });
const active = computed(() => {
  editor.rev;
  return !!props.node && keyframeAt(props.node, props.rb.path);
});
function rec() {
  if (!props.node) return;
  recordProps(props.node, [[props.rb.path, props.rb.read(props.node)]]);
}
</script>

<template>
  <span class="rec" :class="{ on: active }" title="在当前帧记录" @click="rec"></span>
</template>

<style scoped>
.rec { width: 11px; height: 11px; flex: none; cursor: pointer;
  border: 1.5px solid #c5c8ce; transform: rotate(45deg); border-radius: 2px; transition: .15s; }
.rec:hover { border-color: #ed4014; }
.rec.on { background: #ed4014; border-color: #ed4014; }
</style>
