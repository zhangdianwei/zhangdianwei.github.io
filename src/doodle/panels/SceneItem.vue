<script setup>
import { ref, computed, nextTick } from "vue";
import { isNode } from "../Node.js";
import { editor, selectNodes, touch, moveNode } from "../editor.js";

const props = defineProps({ node: Object });
const inp = ref(null);
const editing = ref(false);
const name = ref("");
const hint = ref("");

const kids = computed(() => { editor.rev; return props.node.children.filter(c => isNode(c)); });
const selected = computed(() => { editor.rev; return editor.selectedIds.includes(props.node.id); });
const isRoot = computed(() => props.node === editor.root);

function startEdit() {
  name.value = props.node.name; editing.value = true;
  nextTick(() => inp.value?.focus());
}
function commit() {
  if (!editing.value) return;
  props.node.name = name.value.trim() || props.node.name;
  editing.value = false; touch();
}

function onDragStart(e) { e.dataTransfer.setData("id", props.node.id); e.stopPropagation(); }
function onDragOver(e) {
  if (isRoot.value) { hint.value = "inside"; return; }
  const r = e.currentTarget.getBoundingClientRect(), y = e.clientY - r.top;
  hint.value = y < r.height * 0.28 ? "before" : y > r.height * 0.72 ? "after" : "inside";
}
function onDrop(e) {
  e.stopPropagation();
  const id = e.dataTransfer.getData("id"), pos = isRoot.value ? "inside" : (hint.value || "inside");
  hint.value = "";
  if (id && id !== props.node.id) moveNode(id, props.node.id, pos);
}
</script>

<template>
  <div class="item">
    <div class="row" :class="[{ sel: selected }, hint]" draggable="true"
      @click.stop="selectNodes([node.id])" @dblclick.stop="startEdit"
      @dragstart="onDragStart" @dragover.prevent="onDragOver" @dragleave="hint = ''" @drop="onDrop">
      <input v-if="editing" ref="inp" v-model="name" class="edit" @click.stop @keydown.enter="commit" @blur="commit" />
      <span v-else class="name">{{ node.name }}</span>
    </div>
    <div class="children">
      <SceneItem v-for="c in kids" :key="c.id" :node="c" />
    </div>
  </div>
</template>

<style scoped>
.row { position: relative; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 13px; user-select: none; }
.row:hover { background: #f3f4f6; }
.row.sel { background: #e8f4ff; color: #2d8cf0; }
.row.inside { outline: 1px solid #2d8cf0; outline-offset: -1px; }
.row.before::before, .row.after::after { content: ""; position: absolute; left: 0; right: 0; height: 2px; background: #2d8cf0; }
.row.before::before { top: -1px; }
.row.after::after { bottom: -1px; }
.edit { width: 100%; border: 1px solid #2d8cf0; border-radius: 3px; padding: 0 4px; font-size: 13px; }
.children { margin-left: 14px; }
</style>
