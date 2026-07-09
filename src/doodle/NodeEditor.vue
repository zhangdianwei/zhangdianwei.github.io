<script setup>
import { onMounted, onBeforeUnmount, ref, markRaw } from "vue";
import * as PIXI from "pixi.js";
import { editor, setPlaying, buildMenu, enterShape, exitShape, clearSelection, removeSelected, removeSelectedVerts, nudge, exportJSON } from "./editor.js";
import { EditorPixi } from "./EditorPixi.js";
import { buildScene } from "./scene.js";
import { CompAnim } from "./CompAnim.js";
import { adapt, relayout } from "./adapt.js";
import MenuBar from "./panels/MenuBar.vue";
import SceneTree from "./panels/SceneTree.vue";
import Inspector from "./panels/Inspector.vue";
import Timeline from "./panels/Timeline.vue";
import ContextMenu from "./panels/ContextMenu.vue";
import VertRadius from "./panels/VertRadius.vue";

const canvas = ref(null);
const menu = ref(null);
let app = null;

function onKey(e) {
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
  const k = e.key;
  if (k === "Escape") editor.mode === "shape" ? exitShape() : clearSelection();
  else if (k === "Delete" || k === "Backspace") editor.mode === "shape" ? removeSelectedVerts() : removeSelected();
  else if (k === "Enter") { if (editor.mode === "node" && editor.selectedIds.length === 1) enterShape(); }
  else if (k === " ") { e.preventDefault(); setPlaying(!editor.playing); }
  else if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "S")) { e.preventDefault(); exportJSON(); }
  else if (k.startsWith("Arrow") && editor.mode === "node") {
    e.preventDefault();
    const d = e.shiftKey ? 10 : 1;
    nudge(k === "ArrowLeft" ? -d : k === "ArrowRight" ? d : 0, k === "ArrowUp" ? -d : k === "ArrowDown" ? d : 0);
  }
}

onMounted(() => {
  app = new PIXI.Application({ antialias: true, backgroundAlpha: 0, resizeTo: canvas.value });
  canvas.value.appendChild(app.view);
  const scene = buildScene(app);
  editor.app = markRaw(app);
  editor.root = markRaw(scene.root);
  editor.duration = scene.root.getComp(CompAnim)?.current?.duration || 0;
  const pixi = new EditorPixi(app, scene.root);
  pixi.onContextMenu = info => { menu.value = { x: info.screenX, y: info.screenY, items: buildMenu(info.global, info.hits) }; };
  editor.pixi = markRaw(pixi);
  setPlaying(false);
  const fit = () => { adapt.canvas = { w: app.screen.width, h: app.screen.height }; relayout(editor.root); };
  fit();
  app.renderer.on("resize", fit);
  window.addEventListener("keydown", onKey);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  editor.pixi?.dispose?.();
  app?.destroy(true, { children: true });
  editor.app = editor.root = editor.pixi = null;
});
</script>

<template>
  <div class="editor">
    <div class="bar top"><MenuBar /></div>
    <div class="body">
      <div class="side left"><SceneTree /></div>
      <div class="stage"><div ref="canvas" class="cv"></div></div>
      <div class="side right"><Inspector /></div>
    </div>
    <div class="bar bottom"><Timeline /></div>
    <VertRadius />

    <div v-if="menu" class="ctx-mask" @pointerdown="menu = null" @contextmenu.prevent="menu = null">
      <ContextMenu :x="menu.x" :y="menu.y" :items="menu.items" @close="menu = null" @pointerdown.stop />
    </div>
  </div>
</template>

<style scoped>
.editor { display: flex; flex-direction: column; height: 100vh; background: #fff; }
.bar { padding: 8px 12px; background: #f8f8f9; flex: none; }
.bar.top { border-bottom: 1px solid #e8eaec; }
.bar.bottom { border-top: 1px solid #e8eaec; }
.body { flex: 1; min-height: 0; display: flex; }
.side { flex: none; overflow: auto; background: #fff; }
.side.left { width: 220px; border-right: 1px solid #e8eaec; padding: 8px; }
.side.right { width: 288px; border-left: 1px solid #e8eaec; padding: 8px; }
.stage { flex: 1; min-width: 0; background: linear-gradient(135deg, #eef1fb 0%, #d8f7ec 100%); }
.cv { width: 100%; height: 100%; }
.ctx-mask { position: fixed; inset: 0; z-index: 999; }
</style>
