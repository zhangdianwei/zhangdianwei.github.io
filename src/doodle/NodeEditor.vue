<script setup>
import { onMounted, onBeforeUnmount, ref, markRaw } from "vue";
import * as PIXI from "pixi.js";
import { editor, setPlaying, buildMenu, enterShape, exitShape, clearSelection, removeSelected, removeSelectedVerts, nudge, exportJSON } from "./editor.js";
import { EditorPixi } from "./EditorPixi.js";
import { buildScene } from "./scene.js";
import { CompAnim } from "./CompAnim.js";
import { adapt, relayout } from "./adapt.js";
import MenuBar from "./panels/MenuBar.vue";
import Inspector from "./panels/Inspector.vue";
import AnimEditor from "./panels/AnimEditor.vue";
import ContextMenu from "./panels/ContextMenu.vue";
import VertRadius from "./panels/VertRadius.vue";

const canvas = ref(null);
const menu = ref(null);
const splitL = ref(0.12);   // 左空 / 其余
const splitR = ref(0.78);   // 中列(舞台+时间轴) / Inspector
const splitV = ref(0.66);   // 舞台 / 时间轴
let app = null, ro = null;

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
  // pixi resizeTo 只感知 window;拖 Split 改变的是元素尺寸,需用 ResizeObserver 同步
  ro = new ResizeObserver(() => {
    const el = canvas.value; if (!app || !el || !el.clientWidth || !el.clientHeight) return;
    app.renderer.resize(el.clientWidth, el.clientHeight);
  });
  ro.observe(canvas.value);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  ro?.disconnect();
  editor.pixi?.dispose?.();
  app?.destroy(true, { children: true });
  editor.app = editor.root = editor.pixi = null;
});
</script>

<template>
  <div class="editor">
    <div class="bar top"><MenuBar /></div>
    <div class="body">
      <Split v-model="splitL" mode="horizontal" min="5%" max="40%">
        <template #left><div class="side left"></div></template>
        <template #right>
          <Split v-model="splitR" mode="horizontal" min="40%" max="92%">
            <template #left>
              <Split v-model="splitV" mode="vertical" min="30%" max="88%">
                <template #top><div class="stage" @contextmenu.prevent><div ref="canvas" class="cv"></div></div></template>
                <template #bottom><div class="animwrap"><AnimEditor /></div></template>
              </Split>
            </template>
            <template #right><div class="side right"><Inspector /></div></template>
          </Split>
        </template>
      </Split>
    </div>
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
.body { flex: 1; min-height: 0; position: relative; }
.side { height: 100%; overflow: auto; background: #fff; box-sizing: border-box; }
.side.right { padding: 8px; }
.stage { height: 100%; background: linear-gradient(135deg, #eef1fb 0%, #d8f7ec 100%); }
.cv { width: 100%; height: 100%; }
.animwrap { height: 100%; background: #fff; border-top: 1px solid #e8eaec; overflow: hidden; }
.ctx-mask { position: fixed; inset: 0; z-index: 999; }
</style>
