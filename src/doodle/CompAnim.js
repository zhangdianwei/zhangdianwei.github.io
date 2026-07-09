import { Component } from "./Component.js";
import { CompShape } from "./CompShape.js";
import { updater } from "./runtime.js";

function resolve(path, host, sceneMap) {
  let segs = path.split("/"), node = host;
  if (segs[0][0] === "#") { node = sceneMap.get(segs[0].slice(1)); segs = segs.slice(1); }
  const [scope, ...r] = segs;
  const shape = () => node?.getComp(CompShape);
  switch (scope) {
    case "transform": return { obj: node, key: r[0], shape: null };
    case "style": { const s = shape(); return { obj: (r[0] in s.rough) ? s.rough : s, key: r[0], shape: s }; }
    case "vert": { const s = shape(); return { obj: s.verts.find(v => v.id === r[0]), key: r[1], shape: s }; }
  }
}

export class Track {
  constructor(target, keys) {
    this.target = target;
    this.keys = keys;
    this._ref = null;
  }
  bind(host, sceneMap) { this._ref = resolve(this.target, host, sceneMap); }
  apply(time) {
    const ref = this._ref;
    ref.obj[ref.key] = this._sample(time);
    return ref.shape;
  }
  _sample(t) {
    const k = this.keys;
    if (t <= k[0].t) return k[0].value;
    const e = k[k.length - 1];
    if (t >= e.t) return e.value;
    for (let i = 0; i < k.length - 1; i++) {
      const a = k[i], b = k[i + 1];
      if (t <= b.t) return a.value + (b.value - a.value) * (t - a.t) / (b.t - a.t);
    }
  }
}

export class Clip {
  constructor(name, tracks = [], loop = true) {
    this.name = name;
    this.tracks = tracks;
    this.loop = loop;
    this.duration = 0;
  }
}

export class CompAnim extends Component {
  clips = {};
  current = null;
  currentName = null;
  time = 0;
  playing = true;

  constructor(clips = {}) {
    super();
    for (const [name, c] of Object.entries(clips)) {
      this.clips[name] = new Clip(name, c.tracks || [], c.loop ?? true);
    }
  }

  onAdd() { this.bind(); this.play(); }

  bind(sceneMap = new Map()) {
    for (const c of Object.values(this.clips)) {
      for (const t of c.tracks) t.bind(this.node, sceneMap);
      this._dur(c);
    }
  }
  _dur(c) { c.duration = Math.max(0, ...c.tracks.map(t => t.keys[t.keys.length - 1].t)); }

  firstClip() { return Object.keys(this.clips)[0]; }
  addClip(name, tracks = [], loop = true) {
    const c = new Clip(name, tracks, loop);
    this.clips[name] = c;
    if (this.node) { for (const t of tracks) t.bind(this.node); this._dur(c); }
    return c;
  }
  removeClip(name) {
    delete this.clips[name];
    if (this.currentName === name) this.stop();
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
    this.time += dt;
    if (c.loop && dur > 0) this.time %= dur;
    else if (this.time > dur) this.time = dur;
    const dirty = new Set();
    for (const t of c.tracks) { const s = t.apply(this.time); if (s) dirty.add(s); }
    for (const s of dirty) s.redraw();
  }
}
