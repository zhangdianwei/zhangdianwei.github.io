import { Graphics } from "pixi.js";
import { markRaw } from "vue";
import { isNode } from "./Node.js";
import { CompShape } from "./CompShape.js";
import { CompAnim } from "./CompAnim.js";
import { editor, selectNodes, toggleNode, clearSelection, enterShape, exitShape, setPlaying, findNode, insertVertex, rebindAnim } from "./editor.js";
import { pointInPoly, vertsBounds, worldBounds, rectsIntersect, normRect, pointToSegment, localBounds } from "./geom.js";
import { loadNodeFromJson } from "./serialize.js";
import { tick } from "./runtime.js";
import { adapt, relayout, syncPos } from "./adapt.js";

const HANDLE = 6;
const HIT = 9;
const PICK = 14;   // 顶点命中半径(屏幕像素,恒定,不随视图缩放)

export class EditorPixi {
  constructor(app, root) {
    this.app = app;
    this.root = root;
    this.overlay = new Graphics();
    app.stage.addChild(this.overlay);
    this.drag = null;
    this.hoverEdge = null;
    this.onContextMenu = null;

    const stage = app.stage;
    stage.eventMode = "static";
    stage.hitArea = app.screen;
    stage.on("pointerdown", e => this._down(e));
    stage.on("pointermove", e => this._move(e.global, e.shiftKey, e.ctrlKey || e.metaKey));
    stage.on("pointerup", () => this._up());
    stage.on("pointerupoutside", () => this._up());

    const v = app.view;
    v.addEventListener("contextmenu", e => this._context(e));
    v.addEventListener("dblclick", e => this._dblclick(e));
    v.addEventListener("wheel", e => this._wheel(e), { passive: false });
    v.addEventListener("mousedown", e => { if (e.button === 1) e.preventDefault(); }); // 中键防自动滚屏

    // 按住 ctrl/command 即显示手型(静止按下也生效)
    this._onMod = e => {
      if (this.drag) return;
      if (e.ctrlKey || e.metaKey) this.app.view.style.cursor = "grab";
      else if (this._lastG) this._move(this._lastG, e.shiftKey, false);
      else this.app.view.style.cursor = "default";
    };
    window.addEventListener("keydown", this._onMod);
    window.addEventListener("keyup", this._onMod);

    app.ticker.add(() => this._tick());
  }

  dispose() {
    window.removeEventListener("keydown", this._onMod);
    window.removeEventListener("keyup", this._onMod);
  }

  _canvasPos(e) {
    const r = this.app.view.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // 滚轮缩放,以光标为锚点
  _wheel(e) {
    e.preventDefault();
    const { x: mx, y: my } = this._canvasPos(e);
    const v = adapt.view, ox = adapt.origin.x, oy = adapt.origin.y;
    const px = (mx - ox) / v, py = (my - oy) / v;
    const old = adapt.zoom;
    adapt.zoom = Math.min(8, Math.max(0.2, old * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
    const v2 = v * (adapt.zoom / old);
    adapt.pan.x = (mx - px * v2) - this.app.screen.width / 2;
    adapt.pan.y = (my - py * v2) - this.app.screen.height / 2;
    relayout(this.root); editor.rev++;
  }

  _hit(n, g) {
    if (n === this.root) return false;
    const lp = n.toLocal(g), s = n.getComp(CompShape);
    if (s && s.verts.length) {   // 有图形:图形精确命中
      if (pointInPoly(s.verts, lp)) return true;
      const th = Math.max(s.width, 6), m = s.verts.length, segs = s.closed ? m : m - 1;
      for (let i = 0; i < segs; i++) if (pointToSegment(lp, s.verts[i], s.verts[(i + 1) % m]).dist <= th) return true;
      return false;
    }
    const b = this._localBounds(n);                        // fixed/percent/空容器:用设定 size 的框
    return lp.x >= b.minX && lp.x <= b.maxX && lp.y >= b.minY && lp.y <= b.maxY;
  }

  _pick(g) {
    const hit = n => {
      for (let i = n.children.length - 1; i >= 0; i--) {
        const c = n.children[i];
        if (isNode(c)) { const r = hit(c); if (r) return r; }
      }
      return this._hit(n, g) ? n : null;
    };
    return hit(this.root);
  }

  _localBounds(node) { return localBounds(node); }
  _worldBox(n) {
    const b = this._localBounds(n);
    const cs = [n.toGlobal({ x: b.minX, y: b.minY }), n.toGlobal({ x: b.maxX, y: b.minY }), n.toGlobal({ x: b.maxX, y: b.maxY }), n.toGlobal({ x: b.minX, y: b.maxY })];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of cs) { if (c.x < minX) minX = c.x; if (c.x > maxX) maxX = c.x; if (c.y < minY) minY = c.y; if (c.y > maxY) maxY = c.y; }
    return { minX, minY, maxX, maxY };
  }

  // gizmo 几何(全局坐标)
  _gizmo(node) {
    const b = this._localBounds(node);
    const g = p => node.toGlobal(p);
    const corners = [
      g({ x: b.minX, y: b.minY }), g({ x: b.maxX, y: b.minY }),
      g({ x: b.maxX, y: b.maxY }), g({ x: b.minX, y: b.maxY }),
    ];
    const anchor = g({ x: node.pivot.x, y: node.pivot.y });
    const tm = { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 };
    const bm = { x: (corners[3].x + corners[2].x) / 2, y: (corners[3].y + corners[2].y) / 2 };
    let ux = tm.x - bm.x, uy = tm.y - bm.y; const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
    const rot = { x: tm.x + ux * 26, y: tm.y + uy * 26 };
    return { corners, anchor, tm, rot, b };
  }

  _hitGizmo(node, g) {
    const gz = this._gizmo(node);
    const near = p => Math.hypot(p.x - g.x, p.y - g.y) <= HIT;
    if (near(gz.anchor)) return { type: "anchor", node };
    if (near(gz.rot)) {
      const mp = node.parent.toLocal(g);
      return { type: "rotate", node, startRot: node.rotation, startAng: Math.atan2(mp.y - node.y, mp.x - node.x) };
    }
    const bl = [
      { x: gz.b.minX, y: gz.b.minY }, { x: gz.b.maxX, y: gz.b.minY },
      { x: gz.b.maxX, y: gz.b.maxY }, { x: gz.b.minX, y: gz.b.maxY },
    ];
    for (let i = 0; i < 4; i++) if (near(gz.corners[i])) return { type: "scale", node, lc: bl[i], ci: i };
    return null;
  }

  // 命中节点自身或其祖先是否在选中集(用于拖父不拖子)
  _selectedAncestor(n) {
    for (let c = n; c && isNode(c); c = c.parent) if (editor.selectedIds.includes(c.id)) return c;
    return null;
  }
  // 命中节点所属的顶层物件(root 的直接子)——点选/拖拽以物件为单位
  _topLevel(n) {
    let c = n;
    while (c.parent && c.parent !== this.root && isNode(c.parent)) c = c.parent;
    return c;
  }

  _down(e) {
    if (e.button === 2) return;
    const g = { x: e.global.x, y: e.global.y }, shift = e.shiftKey;
    if (e.button === 1 || e.ctrlKey || e.metaKey) { this.drag = { type: "pan", sx: g.x, sy: g.y, px: adapt.pan.x, py: adapt.pan.y }; this.app.view.style.cursor = "grabbing"; return; }
    if (editor.mode === "shape") return this._downShape(g, shift);

    if (editor.selectedIds.length === 1) {
      const node = findNode(editor.selectedIds[0]);
      const h = node && node !== this.root && this._hitGizmo(node, g);
      if (h) { this.drag = h; return; }
    }

    const raw = this._pick(g);
    const hit = raw ? this._topLevel(raw) : null;    // 优先选顶层物件
    if (hit) {
      const selAnc = this._selectedAncestor(hit);   // 命中已选中子树 → 保持选择,拖已选中的
      if (shift) toggleNode(hit.id);
      else if (!selAnc) selectNodes([hit.id]);
      this.drag = { type: "nodes", start: g, hit, moved: false, items: editor.selectedIds.map(id => { const n = findNode(id); return { n, x: n.x, y: n.y }; }) };
    } else {
      if (!shift) clearSelection();
      this.drag = { type: "marquee", shift, base: [...editor.selectedIds] };
      editor.marquee = { x0: g.x, y0: g.y, x1: g.x, y1: g.y };
    }
  }

  _vertAt(node, s, g) {   // 屏幕像素阈值命中顶点,与视图缩放无关
    return s.verts.find(v => {
      const sp = node.toGlobal({ x: v.x, y: v.y });
      return Math.hypot(sp.x - g.x, sp.y - g.y) <= PICK;
    });
  }
  _downShape(g, shift) {
    const node = findNode(editor.editingId), s = node?.getComp(CompShape);
    if (!s) return;
    const p = node.toLocal(g);
    const hit = this._vertAt(node, s, g);
    if (hit) {
      if (shift) {
        const set = new Set(editor.selectedVertIds);
        set.has(hit.id) ? set.delete(hit.id) : set.add(hit.id);
        editor.selectedVertIds = [...set]; editor.rev++; return;
      }
      if (!editor.selectedVertIds.includes(hit.id)) editor.selectedVertIds = [hit.id];
      const items = s.verts.filter(v => editor.selectedVertIds.includes(v.id)).map(v => ({ v, x: v.x, y: v.y }));
      this.drag = { type: "verts", node, shape: s, items, start: p };
      editor.rev++;
    } else if (this.hoverEdge) {
      const he = this.hoverEdge; this.hoverEdge = null;
      const vid = insertVertex(he.index, he.x, he.y);
      const v = s.verts.find(x => x.id === vid);
      this.drag = { type: "verts", node, shape: s, items: [{ v, x: v.x, y: v.y }], start: node.toLocal(g) };
    } else {
      this.drag = { type: "vmarquee", node, shape: s, shift, base: [...editor.selectedVertIds] };
      editor.marquee = { x0: g.x, y0: g.y, x1: g.x, y1: g.y };
    }
  }

  _hoverEdge(g) {
    this.app.view.style.cursor = "default";
    const node = findNode(editor.editingId), s = node?.getComp(CompShape);
    if (!s) { this.hoverEdge = null; return; }
    const p = node.toLocal(g);
    if (this._vertAt(node, s, g)) { this.hoverEdge = null; return; }
    const n = s.verts.length, segs = s.closed ? n : n - 1;
    let best = null;
    for (let i = 0; i < segs; i++) {
      const r = pointToSegment(p, s.verts[i], s.verts[(i + 1) % n]);
      if (r.t > 0 && r.t < 1 && r.dist <= 8 && (!best || r.dist < best.dist)) best = { x: r.x, y: r.y, index: i + 1 };
    }
    this.hoverEdge = best;
  }

  vertScreen(vid) {
    const node = findNode(editor.editingId), s = node?.getComp(CompShape);
    const v = s?.verts.find(x => x.id === vid);
    if (!v) return null;
    const gp = node.toGlobal({ x: v.x, y: v.y });
    const r = this.app.view.getBoundingClientRect();
    return { x: r.left + gp.x, y: r.top + gp.y };
  }

  _move(g, shift, mod) {
    this._lastG = g;
    const d = this.drag;
    if (!d) {
      if (mod) { this.app.view.style.cursor = "grab"; return; }
      editor.mode === "shape" ? this._hoverEdge(g) : this._hoverCursor(g);
      return;
    }
    if (d.type === "pan") {
      adapt.pan.x = d.px + (g.x - d.sx); adapt.pan.y = d.py + (g.y - d.sy);
      relayout(this.root); editor.rev++; return;
    }
    if (d.type === "marquee" || d.type === "vmarquee") {
      editor.marquee = { ...editor.marquee, x1: g.x, y1: g.y }; editor.rev++;
    } else if (d.type === "nodes") {
      if (!d.moved && Math.hypot(g.x - d.start.x, g.y - d.start.y) <= 3) return;   // 阈值内视为点击
      d.moved = true;
      for (const it of d.items) {
        const p0 = it.n.parent.toLocal(d.start), p1 = it.n.parent.toLocal(g);
        it.n.x = it.x + (p1.x - p0.x); it.n.y = it.y + (p1.y - p0.y);
        syncPos(it.n);
      }
      editor.rev++;
    } else if (d.type === "verts") {
      const p = d.node.toLocal(g), dx = p.x - d.start.x, dy = p.y - d.start.y;
      for (const it of d.items) { it.v.x = it.x + dx; it.v.y = it.y + dy; }
      d.shape.redraw(); editor.rev++;
    } else if (d.type === "scale") {
      const n = d.node, mp = n.parent.toLocal(g), t = n.rotation;
      const dx = mp.x - n.x, dy = mp.y - n.y;
      const ux = Math.cos(t) * dx + Math.sin(t) * dy, uy = -Math.sin(t) * dx + Math.cos(t) * dy;
      let sx = Math.abs(d.lc.x - n.pivot.x) > 1e-3 ? ux / (d.lc.x - n.pivot.x) : n.scale.x;
      let sy = Math.abs(d.lc.y - n.pivot.y) > 1e-3 ? uy / (d.lc.y - n.pivot.y) : n.scale.y;
      if (shift) { const s = Math.abs(sx) >= Math.abs(sy) ? sx : sy; sx = sy = s; }
      n.scale.set(sx, sy); editor.rev++;
    } else if (d.type === "rotate") {
      const n = d.node, mp = n.parent.toLocal(g);
      const ang = Math.atan2(mp.y - n.y, mp.x - n.x);
      let rot = d.startRot + (ang - d.startAng);
      if (shift) { const step = Math.PI / 12; rot = Math.round(rot / step) * step; }
      n.rotation = rot; editor.rev++;
    } else if (d.type === "anchor") {
      const n = d.node, lp = n.toLocal(g), t = n.rotation;
      const dxl = (lp.x - n.pivot.x) * n.scale.x, dyl = (lp.y - n.pivot.y) * n.scale.y;
      n.x += dxl * Math.cos(t) - dyl * Math.sin(t);
      n.y += dxl * Math.sin(t) + dyl * Math.cos(t);
      n.pivot.set(lp.x, lp.y); editor.rev++;
    }
  }

  _up() {
    const d = this.drag; this.drag = null;
    if (!d) return;
    if (d.type === "pan") { this.app.view.style.cursor = "default"; return; }
    if (d.type === "nodes") {
      if (!d.moved && d.hit) selectNodes([d.hit.id]);   // 未拖动=点击 → 选中命中节点(可能是子)
      else for (const it of d.items) syncPos(it.n);
      return;
    }
    if (d.type === "marquee") {
      const box = normRect(editor.marquee); editor.marquee = null;
      const picked = [];   // 只选顶层物件(同一层级)
      for (const c of this.root.children) if (isNode(c) && rectsIntersect(box, this._worldBox(c))) picked.push(c.id);
      const set = new Set(d.shift ? d.base : []);
      picked.forEach(id => set.add(id));
      selectNodes([...set]);
    } else if (d.type === "vmarquee") {
      const box = normRect(editor.marquee); editor.marquee = null;
      const ids = d.shape.verts.filter(v => {
        const p = d.node.toGlobal({ x: v.x, y: v.y });
        return p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
      }).map(v => v.id);
      editor.selectedVertIds = d.shift ? [...new Set([...d.base, ...ids])] : ids;
      editor.rev++;
    }
  }

  _dblclick(e) {
    const g = this._canvasPos(e);
    if (editor.mode === "shape") {
      const node = findNode(editor.editingId), s = node?.getComp(CompShape);
      if (!s || !pointInPoly(s.verts, node.toLocal(g))) exitShape();
      return;
    }
    const hit = this._pick(g);
    if (hit) enterShape(hit.id);
  }

  _hoverCursor(g) {
    let cur = "default";
    if (editor.selectedIds.length === 1) {
      const n = findNode(editor.selectedIds[0]);
      const h = n && n !== this.root && this._hitGizmo(n, g);
      if (h) cur = h.type === "anchor" ? "move" : h.type === "rotate" ? "grab" : (h.ci % 2 === 0 ? "nwse-resize" : "nesw-resize");
    }
    this.app.view.style.cursor = cur;
  }

  _pickAll(g) {
    const out = [];
    const walk = n => {
      for (let i = n.children.length - 1; i >= 0; i--) { const c = n.children[i]; if (isNode(c)) walk(c); }
      if (this._hit(n, g)) out.push(n);
    };
    walk(this.root);
    return out;
  }

  _context(e) {
    e.preventDefault();
    const g = this._canvasPos(e);
    let hits = [];
    if (editor.mode === "node") hits = this._pickAll(g).map(n => ({ id: n.id, name: n.name }));
    this.onContextMenu?.({ screenX: e.clientX, screenY: e.clientY, global: g, hits });
  }

  _tick() {
    tick(this.app.ticker.deltaMS / 1000);
    const a = this.root?.getComp(CompAnim);
    if (a) {
      editor.time = a.time; editor.duration = a.current?.duration || 0;
      if (editor.playing && !a.playing) setPlaying(false);   // 动画播完自停 → 同步编辑器播放态
    }
    this._overlay();
  }

  _box(o, b) {
    o.lineStyle(1.5, 0x2d8cf0, 0.9);
    o.drawRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY);
  }

  _drawGizmo(o, n) {
    const gz = this._gizmo(n), c = gz.corners;
    o.lineStyle(1.5, 0x2d8cf0, 0.9);
    o.moveTo(c[0].x, c[0].y);
    for (let i = 1; i < 4; i++) o.lineTo(c[i].x, c[i].y);
    o.lineTo(c[0].x, c[0].y);
    o.moveTo(gz.tm.x, gz.tm.y); o.lineTo(gz.rot.x, gz.rot.y);
    for (const p of c) { o.lineStyle(1.5, 0x2d8cf0); o.beginFill(0xffffff); o.drawRect(p.x - 4, p.y - 4, 8, 8); o.endFill(); }
    o.lineStyle(1.5, 0x2d8cf0); o.beginFill(0xffffff); o.drawCircle(gz.rot.x, gz.rot.y, 5); o.endFill();
    o.lineStyle(1.5, 0x2d8cf0); o.beginFill(0xffffff); o.drawCircle(gz.anchor.x, gz.anchor.y, 5); o.endFill();
    o.lineStyle(0); o.beginFill(0x2d8cf0); o.drawCircle(gz.anchor.x, gz.anchor.y, 2); o.endFill();
  }

  _frames(o) {
    const s = adapt.view, cx = adapt.origin.x, cy = adapt.origin.y;
    const dev = adapt.rect;
    o.lineStyle(1.5, 0x2d8cf0, 0.8);
    this._dashRect(o, cx - dev.w * s / 2, cy - dev.h * s / 2, dev.w * s, dev.h * s);
  }
  _dashRect(o, x, y, w, h, dash = 10, gap = 7) {
    const pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
    for (let i = 0; i < 4; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const len = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / len, uy = (by - ay) / len;
      for (let d = 0; d < len; d += dash + gap) {
        const e = Math.min(d + dash, len);
        o.moveTo(ax + ux * d, ay + uy * d); o.lineTo(ax + ux * e, ay + uy * e);
      }
    }
  }

  _overlay() {
    const o = this.overlay; o.clear();
    this._frames(o);
    if (editor.mode === "shape") {
      const node = findNode(editor.editingId), s = node?.getComp(CompShape);
      if (s) {
        const b = worldBounds(node, s);
        o.lineStyle(1, 0x2d8cf0, 0.4); o.drawRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY);
        for (const v of s.verts) {
          const p = node.toGlobal({ x: v.x, y: v.y });
          o.lineStyle(1.5, 0x2d8cf0);
          o.beginFill(editor.selectedVertIds.includes(v.id) ? 0x2d8cf0 : 0xffffff);
          o.drawCircle(p.x, p.y, HANDLE); o.endFill();
        }
        if (this.hoverEdge && !this.drag) {
          const hp = node.toGlobal({ x: this.hoverEdge.x, y: this.hoverEdge.y });
          o.lineStyle(1.5, 0x2d8cf0, 0.6); o.beginFill(0xffffff, 0.4);
          o.drawCircle(hp.x, hp.y, HANDLE); o.endFill();
        }
      }
    } else {
      const ids = editor.selectedIds;
      if (ids.length === 1) {
        const n = findNode(ids[0]); if (n && n !== this.root) this._drawGizmo(o, n);
      } else {
        for (const id of ids) { const n = findNode(id); if (n) this._box(o, this._worldBox(n)); }
      }
    }
    if (editor.marquee) {
      const b = normRect(editor.marquee);
      o.lineStyle(1, 0x2d8cf0, 0.8); o.beginFill(0x2d8cf0, 0.08);
      o.drawRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY); o.endFill();
    }
  }

  seek(t) {
    const a = this.root?.getComp(CompAnim); if (!a?.current) return;
    a.time = t;   // 直接采样,不走 advance 的循环取模(否则末帧会被弹回首帧)
    const dirty = new Set();
    for (const tr of a.current.tracks) { const s = tr.apply(t); if (s) dirty.add(s); }
    for (const s of dirty) s.redraw();
    editor.time = t; editor.rev++;
  }

  loadScene(json) {
    this.root.destroy();
    const root = loadNodeFromJson(json);
    this.app.stage.addChildAt(root, 0);
    this.root = root;
    editor.root = markRaw(root);
    clearSelection();
    rebindAnim();
    setPlaying(editor.playing);
    relayout(root);
  }
}
