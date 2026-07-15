import { reactive } from "vue";
import { Node, isNode } from "./Node.js";
import { CompShape, vert } from "./CompShape.js";
import { CompAnim, Track } from "./CompAnim.js";
import { vertsBounds, designBounds, subtreeBounds } from "./geom.js";
import { saveNodeToJson } from "./serialize.js";
import { adapt, relayout, syncPos } from "./adapt.js";
import { NEW_ITEMS, ADD_COMPS } from "./comps.js";

export const editor = reactive({
  app: null,
  root: null,
  pixi: null,
  mode: "node",          // node | shape
  selectedIds: [],       // node 模式多选
  editingId: null,       // shape 模式正在编辑的 node
  selectedVertIds: [],   // shape 模式顶点多选
  marquee: null,         // 框选矩形 {x0,y0,x1,y1}
  playing: false,
  time: 0,
  duration: 0,
  rev: 0,
});

export function touch() { editor.rev++; }

// —— 适配
export function relayoutEditor() { relayout(editor.root); editor.rev++; }
export function setDesignSize(w, h) { if (w) adapt.design.w = w; if (h) adapt.design.h = h; relayoutEditor(); }
export function setDevice(i) { adapt.deviceIndex = i; relayoutEditor(); }

export function setPosType(t) {
  for (const n of editableNodes()) {
    if (t === "percent" && n.posType !== "percent") { const b = n.parent?._box || adapt.rect; n.posPct = { x: n.x / b.w + 0.5, y: n.y / b.h + 0.5 }; }
    n.posType = t;
  }
  relayoutEditor();
}
export function setSizeType(t) {
  for (const n of editableNodes()) {
    const b = n.parent?._box || adapt.rect, box = n._box || { w: 100, h: 100 };
    if (t === "fixed" && n.sizeType !== "fixed") n.size = { w: box.w, h: box.h };
    if (t === "percent" && n.sizeType !== "percent") n.sizePct = { x: box.w / b.w || 1, y: box.h / b.h || 1 };
    n.sizeType = t;
  }
  relayoutEditor();
}
export function setPos(axis, v) {
  for (const n of editableNodes()) {
    if (n.posType === "percent") n.posPct[axis] = v;
    else n[axis] = v;
  }
  relayoutEditor();
}
export function setSize(axis, v) {
  for (const n of editableNodes()) {
    if (n.sizeType === "fixed") n.size[axis === "x" ? "w" : "h"] = v;
    else if (n.sizeType === "percent") n.sizePct[axis] = v;
  }
  relayoutEditor();
}

export function eachNode(fn, node = editor.root) {
  if (!node) return;
  fn(node);
  for (const c of node.children) if (isNode(c)) eachNode(fn, c);
}
export function findNode(id, node = editor.root) {
  if (!node) return null;
  if (node.id === id) return node;
  for (const c of node.children) if (isNode(c)) { const r = findNode(id, c); if (r) return r; }
  return null;
}

export const selectedNode = () => editor.mode === "shape" ? findNode(editor.editingId) : findNode(editor.selectedIds[0]);
export const selectedShape = () => selectedNode()?.getComp(CompShape);

// —— 选中(node 模式)
export function selectNodes(ids) { editor.selectedIds = ids; editor.rev++; }
export function toggleNode(id) {
  const s = new Set(editor.selectedIds);
  s.has(id) ? s.delete(id) : s.add(id);
  editor.selectedIds = [...s]; editor.rev++;
}
export function clearSelection() { editor.selectedIds = []; editor.selectedVertIds = []; editor.rev++; }

// —— 模式
export function enterShape(id = editor.selectedIds[0]) {
  if (!id || id === editor.root?.id) return;
  editor.mode = "shape"; editor.editingId = id; editor.selectedVertIds = []; editor.rev++;
}
export function exitShape() {
  const id = editor.editingId;
  editor.mode = "node"; editor.editingId = null; editor.selectedVertIds = [];
  editor.selectedIds = id ? [id] : []; editor.rev++;
}

// —— 结构。新建:总是建新节点(挂显示组件或空);添加组件:挂到已选中节点
// 新建物件:make() 返回成品节点(树),有选中则作为其子节点
export function newNode(make, pos) {
  const parent = findNode(editor.selectedIds[0]) || editor.root;
  const n = make();
  if (pos) { const p = parent.toLocal(pos); n.x = p.x; n.y = p.y; }
  parent.addChild(n); syncPos(n);
  fitSize([n]);        // 初始尺寸 = 子树内容包围框(含 relayout)
  selectNodes([n.id]);
}
// 把内容形心平移到节点原点(视觉不变):内容 -c,节点位置 +R·S·c 补偿
// 使 localBounds(恒居中原点)与偏心图形吻合
function centerContent(n, b) {
  const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
  if (!cx && !cy) return;
  for (const c of n._comps) if (c instanceof CompShape) { c.verts.forEach(v => { v.x -= cx; v.y -= cy; }); c.redraw(); }
  for (const c of n.children) if (isNode(c)) { c.x -= cx; c.y -= cy; syncPos(c); }
  const dx = cx * n.scale.x, dy = cy * n.scale.y, t = n.rotation;
  n.x += dx * Math.cos(t) - dy * Math.sin(t);
  n.y += dx * Math.sin(t) + dy * Math.cos(t);
  syncPos(n);
}
// 按内容包围框重置为固定尺寸(并把内容居中到原点)
export function fitSize(nodes = selectedNodesList()) {
  for (const n of nodes) {
    if (n === editor.root) continue;
    const b = subtreeBounds(n) || { minX: -50, minY: -50, maxX: 50, maxY: 50 };
    centerContent(n, b);
    n.sizeType = "fixed";
    n.size = { w: Math.round(b.maxX - b.minX), h: Math.round(b.maxY - b.minY) };
  }
  relayoutEditor();
}
// 给选中节点挂组件(同类唯一)
export function addCompToSelected(item) {
  const n = findNode(editor.selectedIds[0]); if (!n) return;
  if (!n.getComp(item.cls)) n.addComp(item.make());
  relayoutEditor();
}
export const addCompByKey = key => { const it = ADD_COMPS.find(x => x.key === key); if (it) addCompToSelected(it); };
// 删除选中节点上某类组件
export function removeComps(Cls) {
  for (const n of selectedNodesList()) { const c = n.getComp(Cls); if (c) n.removeComp(c); }
  relayoutEditor();
}
export function nudge(dx, dy) {
  const nodes = editableNodes();
  for (const n of nodes) { n.x += dx; n.y += dy; syncPos(n); }
  if (nodes.length) editor.rev++;
}
export function exportJSON() {
  const blob = new Blob([JSON.stringify(saveNodeToJson(editor.root), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "scene.json"; a.click();
  URL.revokeObjectURL(a.href);
}
export function removeSelected() {
  for (const id of editor.selectedIds) {
    const n = findNode(id);
    if (n && n !== editor.root) { n.parent.removeChild(n); n.destroy(); }
  }
  clearSelection();
}

// —— 缩放归一:把 scale 烘焙进顶点,使 scale=1 而形状不变
export function normalizeScale() {
  for (const n of editableNodes()) {
    const s = n?.getComp(CompShape);
    const sx = n.scale.x, sy = n.scale.y;
    if (s && (sx !== 1 || sy !== 1)) {
      for (const v of s.verts) {
        v.x = n.pivot.x + (v.x - n.pivot.x) * sx;
        v.y = n.pivot.y + (v.y - n.pivot.y) * sy;
      }
      s.redraw();
    }
    n.scale.set(1, 1);
  }
  editor.rev++;
}

// —— 顶点
export function insertVertex(index, x, y, r = 0.5) {
  const s = selectedShape(); if (!s) return null;
  const v = vert(x, y, r);
  s.verts.splice(index, 0, v);
  editor.selectedVertIds = [v.id];
  s.redraw(); editor.rev++;
  return v.id;
}
export function addVertex() {
  const s = selectedShape(); if (!s) return;
  const vs = s.verts, a = vs[vs.length - 1], b = vs[0];
  vs.push(vert((a.x + b.x) / 2, (a.y + b.y) / 2, a.r));
  s.redraw(); editor.rev++;
}
export function removeSelectedVerts() {
  const s = selectedShape(); if (!s) return;
  const del = new Set(editor.selectedVertIds);
  if (!del.size || s.verts.length - del.size < 3) return;
  s.verts = s.verts.filter(v => !del.has(v.id));
  editor.selectedVertIds = []; s.redraw(); editor.rev++;
}

// —— 对齐
function span(type, lo, hi) {
  if (type.startsWith("center")) return (lo + hi) / 2;
  return type === "left" || type === "top" ? lo : hi;
}
export function alignNodes(type) {
  const nodes = selectedNodesList().filter(n => n !== editor.root);
  if (nodes.length < 2) return;
  const items = nodes.map(n => ({ n, b: designBounds(n, editor.root) }));
  const xs = type === "top" || type === "bottom" || type === "centerY";
  const lo = Math.min(...items.map(o => xs ? o.b.minY : o.b.minX));
  const hi = Math.max(...items.map(o => xs ? o.b.maxY : o.b.maxX));
  const target = span(type, lo, hi);
  for (const { n, b } of items) {
    if (type === "left") n.x += target - b.minX;
    else if (type === "right") n.x += target - b.maxX;
    else if (type === "centerX") n.x += target - (b.minX + b.maxX) / 2;
    else if (type === "top") n.y += target - b.minY;
    else if (type === "bottom") n.y += target - b.maxY;
    else if (type === "centerY") n.y += target - (b.minY + b.maxY) / 2;
    syncPos(n);
  }
  editor.rev++;
}
export function alignVerts(type) {
  const s = selectedShape(); if (!s) return;
  const vs = s.verts.filter(v => editor.selectedVertIds.includes(v.id));
  if (vs.length < 2) return;
  const axis = type === "top" || type === "bottom" || type === "centerY" ? "y" : "x";
  const lo = Math.min(...vs.map(v => v[axis])), hi = Math.max(...vs.map(v => v[axis]));
  const target = span(type, lo, hi);
  vs.forEach(v => v[axis] = target);
  s.redraw(); editor.rev++;
}

// —— 多选批量列表(供 Inspector)
export function selectedNodesList() {
  return editor.selectedIds.map(id => findNode(id)).filter(Boolean);
}
// 物件级操作的目标:排除 root(root 是适配/相机容器,变换由 relayout 托管)
export const editableNodes = () => selectedNodesList().filter(n => n !== editor.root);
export function selectedVertsList() {
  const s = selectedShape();
  return s ? s.verts.filter(v => editor.selectedVertIds.includes(v.id)) : [];
}

// —— 分布
export function distributeNodes(axis) {
  const nodes = selectedNodesList().filter(n => n !== editor.root);
  if (nodes.length < 3) return;
  const info = nodes.map(n => {
    const b = designBounds(n, editor.root);
    return { n, c: axis === "x" ? (b.minX + b.maxX) / 2 : (b.minY + b.maxY) / 2 };
  }).sort((a, b) => a.c - b.c);
  const lo = info[0].c, step = (info[info.length - 1].c - lo) / (info.length - 1);
  info.forEach((o, i) => { o.n[axis] += lo + step * i - o.c; syncPos(o.n); });
  editor.rev++;
}
export function distributeVerts(axis) {
  const s = selectedShape(); if (!s) return;
  const vs = selectedVertsList().sort((a, b) => a[axis] - b[axis]);
  if (vs.length < 3) return;
  const lo = vs[0][axis], step = (vs[vs.length - 1][axis] - lo) / (vs.length - 1);
  vs.forEach((v, i) => { v[axis] = lo + step * i; });
  s.redraw(); editor.rev++;
}

// —— 重置变换
export function resetTransform(field) {
  for (const n of editableNodes()) {
    if (field === "pos") { n.x = 0; n.y = 0; syncPos(n); }
    else if (field === "rot") n.rotation = 0;
    else if (field === "scale") n.scale.set(1, 1);
    else if (field === "pivot") n.pivot.set(0, 0);
  }
  editor.rev++;
}

// —— 层级拖拽
function isDescendant(node, maybe) {
  if (maybe === node) return true;
  for (const c of node.children) if (isNode(c) && isDescendant(c, maybe)) return true;
  return false;
}
export function moveNode(dragId, targetId, pos) {
  const drag = findNode(dragId), target = findNode(targetId);
  if (!drag || !target || drag === editor.root || isDescendant(drag, target)) return;
  if (pos !== "inside" && target === editor.root) return;
  const wp = drag.getGlobalPosition();
  drag.parent.removeChild(drag);
  let parent, idx;
  if (pos === "inside") { parent = target; idx = parent.children.length; }
  else { parent = target.parent; idx = parent.getChildIndex(target) + (pos === "after" ? 1 : 0); }
  parent.addChildAt(drag, idx);
  const lp = parent.toLocal(wp);
  drag.position.set(lp.x, lp.y);
  syncPos(drag);
  editor.rev++;
}

// —— node 位置排列
export function arrangeNodes(kind) {
  const ns = editableNodes();
  if (ns.length < 3) return;
  const cx = ns.reduce((a, n) => a + n.x, 0) / ns.length;
  const cy = ns.reduce((a, n) => a + n.y, 0) / ns.length;
  if (kind === "rect") {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ns.forEach(n => { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x); minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y); });
    const w = maxX - minX, h = maxY - minY, peri = 2 * (w + h) || 1;
    ns.forEach((n, i) => {
      const d = peri * i / ns.length;
      if (d < w) { n.x = minX + d; n.y = minY; }
      else if (d < w + h) { n.x = maxX; n.y = minY + (d - w); }
      else if (d < 2 * w + h) { n.x = maxX - (d - w - h); n.y = maxY; }
      else { n.x = minX; n.y = maxY - (d - 2 * w - h); }
    });
  } else {
    const R = ns.reduce((a, n) => a + Math.hypot(n.x - cx, n.y - cy), 0) / ns.length || 1;
    ns.forEach((n, i) => { const a = -Math.PI / 2 + i / ns.length * Math.PI * 2; n.x = cx + Math.cos(a) * R; n.y = cy + Math.sin(a) * R; });
  }
  ns.forEach(syncPos);
  editor.rev++;
}

// —— 顶点样式排列
export function arrangeVerts(kind) {
  const s = selectedShape(); if (!s) return;
  const vs = selectedVertsList();
  if (vs.length < 3) return;
  const cx = vs.reduce((a, v) => a + v.x, 0) / vs.length;
  const cy = vs.reduce((a, v) => a + v.y, 0) / vs.length;
  if (kind === "rect") {
    const b = vertsBounds(vs), w = b.maxX - b.minX, h = b.maxY - b.minY, peri = 2 * (w + h) || 1;
    vs.forEach((v, i) => {
      const d = peri * i / vs.length; v.r = 0;
      if (d < w) { v.x = b.minX + d; v.y = b.minY; }
      else if (d < w + h) { v.x = b.maxX; v.y = b.minY + (d - w); }
      else if (d < 2 * w + h) { v.x = b.maxX - (d - w - h); v.y = b.maxY; }
      else { v.x = b.minX; v.y = b.maxY - (d - 2 * w - h); }
    });
  } else {
    const R = vs.reduce((a, v) => a + Math.hypot(v.x - cx, v.y - cy), 0) / vs.length || 1;
    vs.forEach((v, i) => {
      const a = -Math.PI / 2 + i / vs.length * Math.PI * 2;
      v.x = cx + Math.cos(a) * R; v.y = cy + Math.sin(a) * R;
      v.r = kind === "circle" ? 1 : 0;
    });
  }
  s.redraw(); editor.rev++;
}

// —— 播放 / clip
export const rootAnim = () => editor.root?.getComp(CompAnim);
export function setPlaying(v) {
  editor.playing = v;
  eachNode(n => {
    const a = n?.getComp(CompAnim); if (!a) return;
    if (v && a.current && !a.current.loop && a.time >= a.current.duration) a.time = 0;   // 停在末尾再播 → 从头
    a.playing = v;
  });
  editor.rev++;
}
export function playClip(name) { const a = rootAnim(); if (!a) return; a.play(name); editor.time = 0; editor.rev++; }
export function addClip() {
  const a = rootAnim(); if (!a) return;
  let i = 1, name; do { name = "clip_" + i++; } while (a.clips[name]);
  a.addClip(name, [], false); a.play(name); editor.rev++;
}
export function removeClip(name) { const a = rootAnim(); if (!a) return; a.removeClip(name); a.play(a.firstClip()); editor.rev++; }
export function setClipLoop(v) { const a = rootAnim(); if (a?.current) { a.current.loop = v; editor.rev++; } }
export function renameClip(old, name) { const a = rootAnim(); if (!a) return; a.renameClip(old, (name || "").trim()); editor.rev++; }
export function setClipDuration(frames) { const a = rootAnim(); if (a?.currentName) { a.setDuration(a.currentName, frames); editor.rev++; } }

// —— 关键帧录制 / 编辑(时间以帧为单位)
export function sceneMapNow() { const m = new Map(); eachNode(n => m.set(n.id, n)); return m; }
export function rebindAnim() { rootAnim()?.bind(sceneMapNow()); }

// 在当前帧记录 node 某属性(propPath 相对 root:transform/x、#id/transform/x)
export function recordKeyframe(node, propPath, value) {
  const a = rootAnim(); if (!a?.current) return;
  const target = node === editor.root ? propPath : "#" + node.id + "/" + propPath;
  const c = a.current;
  let tr = c.tracks.find(t => t.target === target);
  if (!tr) { tr = new Track(target, []); c.tracks.push(tr); tr.bind(editor.root, sceneMapNow()); }
  const t = Math.round(editor.time);
  const i = tr.keys.findIndex(k => k.t === t);
  if (i >= 0) tr.keys[i].value = value;
  else { tr.keys.push({ t, value }); tr.keys.sort((x, y) => x.t - y.t); }
  if (t > c.duration) c.duration = t;
}
export function recordProps(node, entries) {
  if (!node) return;
  for (const [path, value] of entries) recordKeyframe(node, path, value);
  editor.rev++;
}
// 当前帧该属性是否已有关键帧(Inspector 菱形实心/空心)
export function keyframeAt(node, propPath) {
  const a = rootAnim(); if (!a?.current || !node) return false;
  const target = node === editor.root ? propPath : "#" + node.id + "/" + propPath;
  const tr = a.current.tracks.find(t => t.target === target);
  return !!tr && tr.keys.some(k => k.t === Math.round(editor.time));
}
export function moveKeyframe(track, key, frame) {
  const a = rootAnim(); if (!a?.current) return;
  key.t = Math.max(0, Math.min(a.current.duration, Math.round(frame)));
  track.keys.sort((x, y) => x.t - y.t); editor.rev++;
}
export function setKeyframeEase(key, ease) { if (key) { key.ease = ease; editor.pixi?.seek(editor.time); editor.rev++; } }
export function removeKeyframe(track, key) {
  const a = rootAnim(); if (!a?.current) return;
  track.keys = track.keys.filter(k => k !== key);
  if (!track.keys.length) a.current.tracks = a.current.tracks.filter(t => t !== track);
  editor.rev++;
}
// 应用动画预设:基于节点当前变换值生成 track,覆盖同属性旧轨道
export function applyPreset(node, preset) {
  const a = rootAnim(); if (!a?.current || !node) return;
  const b = { x: node.x, y: node.y, sx: node.scale.x, sy: node.scale.y, rot: node.rotation, a: node.alpha || 1 };
  const dur = a.current.duration;
  for (const spec of preset.build(b)) {
    const target = node === editor.root ? spec.path : "#" + node.id + "/" + spec.path;
    a.current.tracks = a.current.tracks.filter(t => t.target !== target);
    const tr = new Track(target, spec.keys.map(k => ({ t: Math.round(k.tf * dur), value: k.value, ease: k.ease })));
    tr.bind(editor.root, sceneMapNow());
    a.current.tracks.push(tr);
  }
  editor.pixi?.seek(0);
  setPlaying(true);   // 从头自动播放一次预览
  editor.rev++;
}

// —— 右键菜单构建
export function buildMenu(pos, hits = []) {
  if (editor.mode === "shape") {
    return [
      { label: "加顶点", action: () => addVertex() },
      { label: "删除选中顶点", action: () => removeSelectedVerts() },
      { label: "完成编辑", action: () => exitShape() },
    ];
  }
  const sel = editor.selectedIds.length;
  const newSub = NEW_ITEMS.map(it => it.sep ? { divider: true }
    : it.input ? { label: it.name, input: it.input, action: p => newNode(() => it.make(p), pos) }
    : { label: it.name, action: () => newNode(it.make, pos) });
  const items = [
    { label: "新建", children: newSub },
  ];
  if (sel) items.push({ label: "编辑 Shape", action: () => enterShape() });
  if (sel) items.push({ label: "归一化缩放", action: () => normalizeScale() });
  if (hits.length > 1) items.push({ label: "选择", children: hits.map(h => ({ label: h.name, action: () => selectNodes([h.id]) })) });
  if (sel) items.push({ label: "删除", action: () => removeSelected() });
  return items;
}
