<script setup>
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import { isNode } from "../Node.js";
import { FPS } from "../runtime.js";
import { editor, findNode, selectNodes, touch, moveNode, rootAnim, playClip, addClip, removeClip, setClipLoop, renameClip, setClipDuration, setPlaying, moveKeyframe, removeKeyframe, setKeyframeEase, applyPreset } from "../editor.js";
import { PRESETS } from "../presets.js";

const PROP_LABEL = { pos: "位置", scale: "缩放", rotation: "旋转", alpha: "透明", x: "位置X", y: "位置Y", scaleX: "缩放X", scaleY: "缩放Y" };
const EASE_LIST = [
  { key: "linear", name: "线性" }, { key: "easeIn", name: "缓入" }, { key: "easeOut", name: "缓出" },
  { key: "easeInOut", name: "缓入缓出" }, { key: "backIn", name: "回拉" }, { key: "backOut", name: "回弹" },
];
const EASE_ABBR = { easeIn: "⤹", easeOut: "⤴", easeInOut: "∿", backIn: "↰", backOut: "↱" };
const HEAD_W = 190;

const anim = computed(() => { editor.rev; return rootAnim(); });
const clips = computed(() => { editor.rev; const a = anim.value; return a ? Object.keys(a.clips) : []; });
const currentName = computed(() => { editor.rev; return anim.value?.currentName; });
const clip = computed(() => { editor.rev; return anim.value?.current; });
const duration = computed({ get: () => { editor.rev; return clip.value?.duration || 1; }, set: v => v && setClipDuration(v) });
const loop = computed({ get: () => { editor.rev; return clip.value?.loop ?? true; }, set: setClipLoop });

// 横向缩放:lane 像素宽 = 基础宽(视口-表头) × zoom
const zoom = ref(1);
const rowsEl = ref(null);
const laneW = ref(400);
let ro = null;
onMounted(() => { ro = new ResizeObserver(() => { const el = rowsEl.value; if (el) laneW.value = Math.max(120, el.clientWidth - HEAD_W); }); if (rowsEl.value) ro.observe(rowsEl.value); });
onBeforeUnmount(() => ro?.disconnect());
const laneStyle = computed(() => ({ width: laneW.value * zoom.value + "px" }));

// 展开状态(默认展开;值 === false 表示折叠)
const expKids = ref({}), expTrk = ref({});
function toggleKids(id) { expKids.value = { ...expKids.value, [id]: expKids.value[id] === false }; }
function toggleTrk(id) { expTrk.value = { ...expTrk.value, [id]: expTrk.value[id] === false }; }

const trackNode = t => { const s = t.target.split("/"); return s[0][0] === "#" ? findNode(s[0].slice(1)) : editor.root; };
const propLabel = t => { const s = t.target.split("/"); return PROP_LABEL[s[s.length - 1]] || s[s.length - 1]; };

const rows = computed(() => {
  editor.rev; expKids.value; expTrk.value;
  const c = clip.value, out = [];
  const walk = (n, depth) => {
    const kids = n.children.filter(isNode);
    const trks = c ? c.tracks.filter(t => trackNode(t) === n) : [];
    const ek = expKids.value[n.id] !== false, et = expTrk.value[n.id] !== false;
    out.push({ type: "node", node: n, depth, key: n.id, hasKids: kids.length > 0, hasTrk: trks.length > 0, ek, et });
    if (et) for (const t of trks) out.push({ type: "prop", node: n, track: t, depth: depth + 1, label: propLabel(t), key: n.id + "|" + t.target });
    if (ek) for (const ch of kids) walk(ch, depth + 1);
  };
  if (editor.root) walk(editor.root, 0);
  return out;
});

const pct = f => (duration.value ? f / duration.value * 100 : 0) + "%";
const segLeft = (keys, i) => pct(keys[i].t);
const segWidth = (keys, i) => (keys[i + 1].t - keys[i].t) / duration.value * 100 + "%";
const isSel = n => editor.selectedIds.includes(n.id);

// clip 改名
const editClip = ref(null), clipName = ref("");
function startClip(name) { editClip.value = name; clipName.value = name; }
function commitClip() { if (editClip.value != null) { renameClip(editClip.value, clipName.value); editClip.value = null; } }

// node 改名 / 层级拖拽
const editNode = ref(null), nodeName = ref("");
function startNode(n, e) { editNode.value = n.id; nodeName.value = n.name; const h = e.currentTarget; nextTick(() => h.querySelector("input")?.focus()); }
function commitNode(n) { if (editNode.value === n.id) { n.name = nodeName.value.trim() || n.name; editNode.value = null; touch(); } }
function nodeDragStart(e, n) { e.dataTransfer.setData("id", n.id); }
function nodeDrop(e, n) { const id = e.dataTransfer.getData("id"); if (id && id !== n.id) moveNode(id, n.id, "inside"); }

// 预设菜单(向上弹) / easing 菜单
const menu = ref(null), easeMenu = ref(null);
function openMenu(e, node) { e.preventDefault(); menu.value = { x: e.clientX, yb: window.innerHeight - e.clientY, node }; }
function pickPreset(p) { if (menu.value) { applyPreset(menu.value.node, p); menu.value = null; } }
function openEase(e, track, i) { e.preventDefault(); e.stopPropagation(); easeMenu.value = { x: e.clientX, yb: window.innerHeight - e.clientY, key: track.keys[i] }; }
function pickEase(k) { if (easeMenu.value) { setKeyframeEase(easeMenu.value.key, k); easeMenu.value = null; } }
function closeMenus() { menu.value = null; easeMenu.value = null; }

// 关键帧:选中 / 拖动 / 右键删
const selKey = ref(null);
let kdrag = null;
function keyDown(e, track, key) {
  selKey.value = { track, key };
  kdrag = { track, key, lane: e.currentTarget.closest(".lane") };
  window.addEventListener("pointermove", onKeyMove);
  window.addEventListener("pointerup", onKeyUp);
}
function onKeyMove(e) {
  if (!kdrag) return;
  const r = kdrag.lane.getBoundingClientRect();
  moveKeyframe(kdrag.track, kdrag.key, (e.clientX - r.left) / r.width * duration.value);
}
function onKeyUp() { kdrag = null; window.removeEventListener("pointermove", onKeyMove); window.removeEventListener("pointerup", onKeyUp); }

// 当前帧:点/拖标尺或 lane
let scrub = null;
function scrubDown(e) { if (!currentName.value) return; scrub = e.currentTarget; seekAt(e); window.addEventListener("pointermove", onScrub); window.addEventListener("pointerup", offScrub); }
function seekAt(e) {
  const r = scrub.getBoundingClientRect();
  editor.pixi?.seek(Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration.value));
}
function onScrub(e) { if (scrub) seekAt(e); }
function offScrub() { scrub = null; window.removeEventListener("pointermove", onScrub); window.removeEventListener("pointerup", offScrub); }

// 播放头跳帧
function seek(f) { if (!currentName.value) return; editor.pixi?.seek(Math.max(0, Math.min(duration.value, Math.round(f)))); }
function step(d) { seek(Math.round(editor.time) + d); }
const ticks = computed(() => { editor.rev; const d = duration.value, out = []; for (let f = 0; f <= d; f += 10) out.push(f); return out; });
</script>

<template>
  <div class="anim">
    <div class="bar">
      <span class="lbl">片段</span>
      <template v-for="name in clips" :key="name">
        <input v-if="editClip === name" v-model="clipName" class="cedit" @keydown.enter="commitClip" @blur="commitClip" />
        <Button v-else size="small" :type="name === currentName ? 'primary' : 'default'" @click="playClip(name)" @dblclick="startClip(name)">{{ name }}</Button>
      </template>
      <Button size="small" icon="md-add" title="新建片段" @click="addClip()" />
      <Button v-if="currentName" size="small" icon="md-trash" title="删除片段" @click="removeClip(currentName)" />

      <span class="sp" />
      <ButtonGroup size="small">
        <Button icon="md-skip-backward" title="开头帧" :disabled="!currentName" @click="seek(0)" />
        <Button icon="ios-arrow-back" title="上一帧" :disabled="!currentName" @click="step(-1)" />
        <Button :icon="editor.playing ? 'md-pause' : 'md-play'" :type="editor.playing ? 'warning' : 'success'" :disabled="!currentName" @click="setPlaying(!editor.playing)" />
        <Button icon="ios-arrow-forward" title="下一帧" :disabled="!currentName" @click="step(1)" />
        <Button icon="md-skip-forward" title="结尾帧" :disabled="!currentName" @click="seek(duration)" />
      </ButtonGroup>
      <InputNumber :model-value="Math.round(editor.time)" :min="0" :max="duration" :step="1" :precision="0" :active-change="false" size="small" style="width:64px" :disabled="!currentName" @on-change="seek" /><span class="unit">帧</span>

      <span class="sp" />
      <span class="lbl">缩放</span><InputNumber v-model="zoom" :min="0.1" :max="8" :step="0.1" :precision="1" size="small" style="width:62px" />
      <span class="lbl">循环</span><i-switch v-model="loop" size="small" :disabled="!currentName" />
      <span class="lbl">时长</span><InputNumber v-model="duration" :min="1" :step="1" :precision="0" size="small" style="width:74px" :disabled="!currentName" /><span class="unit">帧 · {{ (duration / FPS).toFixed(1) }}s</span>
    </div>

    <div class="rows" ref="rowsEl">
      <div class="trow rrow">
        <div class="head corner" />
        <div class="ruler lane" :style="laneStyle" @pointerdown="scrubDown">
          <span v-for="f in ticks" :key="f" class="tick" :class="{ last: f / duration > 0.9 }" :style="{ left: pct(f) }">{{ f }}</span>
          <span class="playhead" :style="{ left: pct(editor.time) }"></span>
        </div>
      </div>

      <div v-for="r in rows" :key="r.key" class="trow" :class="[r.type === 'node' ? 'nrow' : 'prow']">
        <div v-if="r.type === 'node'" class="head nhead" :class="{ sel: isSel(r.node) }" :style="{ paddingLeft: 2 + r.depth * 14 + 'px' }"
          :draggable="editNode !== r.node.id" @click="selectNodes([r.node.id])" @dblclick="startNode(r.node, $event)"
          @contextmenu.prevent="openMenu($event, r.node)"
          @dragstart="nodeDragStart($event, r.node)" @dragover.prevent @drop="nodeDrop($event, r.node)">
          <span class="tw" @click.stop="r.hasKids && toggleKids(r.node.id)" @dblclick.stop><Icon v-if="r.hasKids" :type="r.ek ? 'md-arrow-dropdown' : 'md-arrow-dropright'" /></span>
          <input v-if="editNode === r.node.id" v-model="nodeName" class="nedit" @click.stop @keydown.enter="commitNode(r.node)" @blur="commitNode(r.node)" />
          <span v-else class="nname">{{ r.node.name }}</span>
          <span class="sp2" />
          <span v-if="r.hasTrk" class="tw trk" :title="r.et ? '收起轨道' : '展开轨道'" @click.stop="toggleTrk(r.node.id)" @dblclick.stop><Icon :type="r.et ? 'md-arrow-dropdown' : 'md-arrow-dropright'" /></span>
        </div>
        <div v-else class="head phead" :style="{ paddingLeft: 8 + r.depth * 14 + 'px' }"><span class="dot"></span>{{ r.label }}</div>

        <div class="lane" :class="{ nlane: r.type === 'node' }" :style="laneStyle" @pointerdown="scrubDown">
          <span class="playhead" :style="{ left: pct(editor.time) }"></span>
          <template v-if="r.type === 'prop'">
            <span v-for="(k, i) in r.track.keys.slice(0, -1)" :key="'s' + i" class="seg"
              :style="{ left: segLeft(r.track.keys, i), width: segWidth(r.track.keys, i) }"
              @pointerdown.stop @click.stop="openEase($event, r.track, i)" @contextmenu.prevent.stop="openEase($event, r.track, i)">
              <i v-if="k.ease && k.ease !== 'linear'">{{ EASE_ABBR[k.ease] }}</i>
            </span>
            <span v-for="(k, i) in r.track.keys" :key="i" class="key" :class="{ on: selKey && selKey.track === r.track && selKey.key === k }"
              :style="{ left: pct(k.t) }" :title="k.t + '帧'"
              @pointerdown.stop="keyDown($event, r.track, k)" @contextmenu.prevent="removeKeyframe(r.track, k)"></span>
          </template>
        </div>
      </div>
      <div v-if="!currentName" class="empty">新建一个片段(＋)开始制作动画</div>
    </div>

    <div v-if="menu || easeMenu" class="pmask" @pointerdown="closeMenus" @contextmenu.prevent="closeMenus">
      <div v-if="menu" class="pmenu up" :style="{ left: menu.x + 'px', bottom: menu.yb + 'px' }" @pointerdown.stop>
        <div class="pmi hd">{{ currentName ? '动画预设' : '请先新建片段' }}</div>
        <template v-if="currentName">
          <div v-for="p in PRESETS" :key="p.key" class="pmi" @click="pickPreset(p)">{{ p.name }}</div>
        </template>
      </div>
      <div v-if="easeMenu" class="pmenu up" :style="{ left: easeMenu.x + 'px', bottom: easeMenu.yb + 'px' }" @pointerdown.stop>
        <div class="pmi hd">缓动</div>
        <div v-for="e in EASE_LIST" :key="e.key" class="pmi" :class="{ cur: (easeMenu.key.ease || 'linear') === e.key }" @click="pickEase(e.key)">{{ e.name }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.anim { display: flex; flex-direction: column; height: 100%; font-size: 12px; }
.bar { display: flex; align-items: center; gap: 6px; padding: 6px 8px; flex: none; flex-wrap: wrap; }
.bar .sp { flex: 1; }
.lbl { color: #808695; }
.unit { color: #c5c8ce; }
.cedit { width: 70px; height: 24px; border: 1px solid #2d8cf0; border-radius: 3px; padding: 0 6px; }

.rows { flex: 1; overflow: auto; position: relative; }
.trow { display: flex; height: 24px; width: max-content; min-width: 100%; }

.head { width: 190px; flex: none; display: flex; align-items: center; border-right: 1px solid #e8eaec;
  box-sizing: border-box; overflow: hidden; position: sticky; left: 0; z-index: 5; background: #fff; }
.nhead { cursor: pointer; user-select: none; font-weight: 500; background: #f4f6f8; }
.nhead.sel { background: #e8f4ff; color: #2d8cf0; }
.phead { color: #808695; background: #fff; }
.nname { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp2 { flex: 1; }
.tw { width: 16px; flex: none; display: flex; align-items: center; justify-content: center; color: #808695; cursor: pointer; }
.tw:hover { color: #2d8cf0; }
.tw.trk { border-left: 1px solid #e8eaec; }
.dot { width: 5px; height: 5px; border-radius: 50%; background: #c5c8ce; margin-right: 6px; flex: none; }
.nedit { flex: 1; min-width: 0; border: 1px solid #2d8cf0; border-radius: 3px; padding: 0 4px; font-size: 12px; }

.rrow { height: 20px; position: sticky; top: 0; z-index: 6; }
.rrow .head.corner { background: #fafafa; z-index: 7; }
.ruler { background: #fafafa; cursor: pointer; }
.tick { position: absolute; top: 3px; padding-left: 3px; font-size: 10px; line-height: 12px; color: #808695; white-space: nowrap; pointer-events: none; }
.tick::before { content: ""; position: absolute; left: 0; top: -3px; width: 1px; height: 6px; background: #c5c8ce; }
.tick.last { padding-left: 0; padding-right: 3px; transform: translateX(-100%); }
.tick.last::before { left: auto; right: 0; }

.lane { position: relative; flex: none; }
.lane.nlane { background: #fbfcfd; }
.trow:not(:last-child) .lane { border-bottom: 1px solid #f3f3f4; }
.playhead { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: #ed4014; pointer-events: none; z-index: 3; }

.seg { position: absolute; top: 50%; transform: translateY(-50%); height: 14px; cursor: pointer; z-index: 0; display: flex; align-items: center; }
.seg::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 2px; margin-top: -1px; background: #dbe3ea; }
.seg:hover::before { background: #7bb8f5; }
.seg i { position: relative; margin: 0 auto; font-size: 10px; font-style: normal; color: #2d8cf0; background: #fff; padding: 0 2px; }
.key { position: absolute; top: 50%; width: 11px; height: 11px; margin: -6px 0 0 -6px; background: #2d8cf0;
  transform: rotate(45deg); border-radius: 2px; cursor: pointer; z-index: 1; }
.key.on { background: #ed4014; box-shadow: 0 0 0 2px rgba(237,64,20,.25); }
.empty { color: #c5c8ce; padding: 16px; text-align: center; position: sticky; left: 0; }

.pmask { position: fixed; inset: 0; z-index: 1000; }
.pmenu { position: fixed; min-width: 132px; padding: 4px; background: #fff; border: 1px solid #e8eaec;
  border-radius: 6px; box-shadow: 0 4px 16px rgba(0,0,0,.16); }
.pmi { padding: 5px 10px; border-radius: 4px; cursor: pointer; white-space: nowrap; }
.pmi:hover { background: #f0faff; }
.pmi.cur { color: #2d8cf0; }
.pmi.hd { color: #808695; font-size: 11px; cursor: default; }
.pmi.hd:hover { background: none; }
</style>
