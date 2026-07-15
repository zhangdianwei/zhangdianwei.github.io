import { Component } from "./Component.js";
import { CompShape } from "./CompShape.js";
import { updater, FPS } from "./runtime.js";

// 缓动函数:段的 easing 存在该段起点关键帧的 ease 字段上
export const EASINGS = {
  linear: r => r,
  easeIn: r => r * r,
  easeOut: r => 1 - (1 - r) * (1 - r),
  easeInOut: r => r < .5 ? 2 * r * r : 1 - Math.pow(-2 * r + 2, 2) / 2,
  backIn: r => { const c = 1.70158; return (c + 1) * r * r * r - c * r * r; },
  backOut: r => { const c = 1.70158; return 1 + (c + 1) * Math.pow(r - 1, 3) + c * Math.pow(r - 1, 2); },
};

// 一条 track = 一个逻辑属性,可含多个分量(pos→x,y;scale→x,y);value 存分量数组
function resolve(path, host, sceneMap) {
  let segs = path.split("/"), node = host;
  if (segs[0][0] === "#") { node = sceneMap.get(segs[0].slice(1)); segs = segs.slice(1); }
  const [scope, ...r] = segs;
  const shape = () => node?.getComp(CompShape);
  switch (scope) {
    case "transform": {
      const k = r[0];
      if (k === "pos") return { refs: [{ obj: node, key: "x" }, { obj: node, key: "y" }], shape: null };
      if (k === "scale") return { refs: [{ obj: node.scale, key: "x" }, { obj: node.scale, key: "y" }], shape: null };
      if (k === "scaleX") return { refs: [{ obj: node.scale, key: "x" }], shape: null };
      if (k === "scaleY") return { refs: [{ obj: node.scale, key: "y" }], shape: null };
      return { refs: [{ obj: node, key: k }], shape: null };   // x / y / rotation / alpha
    }
    case "style": { const s = shape(); return { refs: [{ obj: (r[0] in s.rough) ? s.rough : s, key: r[0] }], shape: s }; }
    case "vert": { const s = shape(); return { refs: [{ obj: s.verts.find(v => v.id === r[0]), key: r[1] }], shape: s }; }
  }
}

export class Track {
  constructor(target, keys) {
    this.target = target;
    this.keys = keys;   // [{ t, value: number[] }]
    this._ref = null;
  }
  bind(host, sceneMap) { this._ref = resolve(this.target, host, sceneMap); }
  apply(time) {
    const ref = this._ref;
    if (!ref) return null;
    const v = this._sample(time), rs = ref.refs;
    for (let i = 0; i < rs.length; i++) if (rs[i].obj) rs[i].obj[rs[i].key] = v[i];
    return ref.shape;
  }
  _sample(t) {
    const k = this.keys;
    if (!k.length) return [];
    if (t <= k[0].t) return k[0].value;
    const e = k[k.length - 1];
    if (t >= e.t) return e.value;
    for (let i = 0; i < k.length - 1; i++) {
      const a = k[i], b = k[i + 1];
      if (t <= b.t) {
        let r = (t - a.t) / (b.t - a.t);
        r = (EASINGS[a.ease] || EASINGS.linear)(r);
        return a.value.map((av, j) => av + (b.value[j] - av) * r);
      }
    }
  }
}

export class Clip {
  constructor(name, tracks = [], loop = false, duration = 60) {
    this.name = name;
    this.tracks = tracks;
    this.loop = loop;
    this.duration = duration;   // 帧,手动
  }
}

export class CompAnim extends Component {
  clips = {};
  current = null;
  currentName = null;
  time = 0;          // 帧
  playing = true;

  constructor(clips = {}) {
    super();
    for (const [name, c] of Object.entries(clips)) {
      this.clips[name] = new Clip(name, c.tracks || [], c.loop ?? false, c.duration ?? 60);
    }
  }

  onAdd() { this.bind(); this.play(); }

  bind(sceneMap = new Map()) {
    for (const c of Object.values(this.clips))
      for (const t of c.tracks) t.bind(this.node, sceneMap);
  }

  firstClip() { return Object.keys(this.clips)[0]; }
  addClip(name, tracks = [], loop = false, duration = 60) {
    const c = new Clip(name, tracks, loop, duration);
    this.clips[name] = c;
    if (this.node) for (const t of tracks) t.bind(this.node);
    return c;
  }
  removeClip(name) {
    delete this.clips[name];
    if (this.currentName === name) this.stop();
  }
  renameClip(old, name) {
    if (old === name || !name || !this.clips[old] || this.clips[name]) return;
    const next = {};   // 重建以保序
    for (const [k, v] of Object.entries(this.clips)) {
      if (k === old) { v.name = name; next[name] = v; } else next[k] = v;
    }
    this.clips = next;
    if (this.currentName === old) this.currentName = name;
  }
  setDuration(name, frames) {
    const c = this.clips[name]; if (c) c.duration = Math.max(1, Math.round(frames));
  }
  play(name = this.firstClip()) {
    this.current = this.clips[name] || null;
    this.currentName = this.current ? name : null;
    this.time = 0;
    if (this.current) updater.add(this);
  }
  stop() { this.current = null; this.currentName = null; updater.delete(this); }
  onRemove() { updater.delete(this); }

  advance(dt) {
    if (!this.playing || !this.current) return;
    const c = this.current, dur = c.duration;
    this.time += dt * FPS;
    if (c.loop && dur > 0) this.time %= dur;
    else if (this.time >= dur) { this.time = dur; this.playing = false; }   // 非循环:播完自停
    const dirty = new Set();
    for (const t of c.tracks) { const s = t.apply(this.time); if (s) dirty.add(s); }
    for (const s of dirty) s.redraw();
  }
}
